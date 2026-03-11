import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  Delete,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthRequest } from "../auth/auth.types";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

const INFINITE_STOCK = -1;

@Controller("stores/:storeSlug/products")
export class ProductsController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Helpers ──────────────────────────────────────────────

  private async getApprovedStore(storeSlug: string) {
    const store = await this.prisma.store.findUnique({
      where: { slug: storeSlug },
    });
    if (!store || store.status !== "APPROVED") {
      throw new NotFoundException("Store not found");
    }
    return store;
  }

  private async getMembershipOrFail(userId: string, storeId: string) {
    const membership = await this.prisma.storeMembership.findUnique({
      where: { userId_storeId: { userId, storeId } },
    });
    if (!membership) throw new ForbiddenException("Not a member of this store");
    const isOwner = membership.role === "OWNER";
    if (!isOwner && !membership.canManageProducts) {
      throw new ForbiddenException("No permission to manage products");
    }
    return membership;
  }

  private async getLocalUser(authUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { authUserId },
    });
    if (!user) throw new NotFoundException("User profile not found");
    return user;
  }

  /** -1 = infinite stock (sentinel). Undefined from frontend = infinite. */
  private resolveStock(stock?: number | null): number {
    if (stock === undefined || stock === null) return INFINITE_STOCK;
    return Math.max(0, stock);
  }

  // ── GET /stores/:storeSlug/products ──────────────────────

  @Get()
  async getProducts(@Param("storeSlug") storeSlug: string) {
    const store = await this.getApprovedStore(storeSlug);

    return this.prisma.product.findMany({
      where: {
        storeId: store.id,
        status: { not: "ARCHIVED" },
      },
      orderBy: { sortOrder: "asc" },
      include: {
        category: true,
        portions: { orderBy: { sortOrder: "asc" } },
        extras: { orderBy: { sortOrder: "asc" } },
        images: { orderBy: { sortOrder: "asc" } },
      },
    });
  }

  // ── GET /stores/:storeSlug/products/:productId ────────────

  @Get(":productId")
  async getProduct(
    @Param("storeSlug") storeSlug: string,
    @Param("productId") productId: string,
  ) {
    const store = await this.getApprovedStore(storeSlug);

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        portions: { orderBy: { sortOrder: "asc" } },
        extras: { orderBy: { sortOrder: "asc" } },
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!product || product.storeId !== store.id || product.status === "ARCHIVED") {
      throw new NotFoundException("Product not found");
    }

    return product;
  }

  // ── POST /stores/:storeSlug/products ─────────────────────

  @Post()
  @UseGuards(AuthGuard)
  async createProduct(
    @Param("storeSlug") storeSlug: string,
    @Req() req: AuthRequest,
    @Body() dto: CreateProductDto,
  ) {
    const store = await this.getApprovedStore(storeSlug);
    const user = await this.getLocalUser(req.authUserId!);
    await this.getMembershipOrFail(user.id, store.id);

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category || category.storeId !== store.id) {
        throw new NotFoundException("Category not found");
      }
    }

    return this.prisma.product.create({
      data: {
        storeId: store.id,
        name: dto.name,
        description: dto.description,
        categoryId: dto.categoryId,
        status: dto.status ?? "DRAFT",
        sortOrder: dto.sortOrder ?? 0,
        portions: {
          create: dto.portions.map((p) => ({
            name: p.name,
            price: p.price,
            stock: this.resolveStock(p.stock),
            isDefault: p.isDefault ?? false,
            sortOrder: p.sortOrder ?? 0,
          })),
        },
        extras: dto.extras
          ? {
              create: dto.extras.map((e) => ({
                name: e.name,
                price: e.price,
                maxQty: e.maxQty ?? 1,
                sortOrder: e.sortOrder ?? 0,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        portions: { orderBy: { sortOrder: "asc" } },
        extras: { orderBy: { sortOrder: "asc" } },
        images: { orderBy: { sortOrder: "asc" } },
      },
    });
  }

  // ── PATCH /stores/:storeSlug/products/:productId ──────────

  @Patch(":productId")
  @UseGuards(AuthGuard)
  async updateProduct(
    @Param("storeSlug") storeSlug: string,
    @Param("productId") productId: string,
    @Req() req: AuthRequest,
    @Body() dto: UpdateProductDto,
  ) {
    const store = await this.getApprovedStore(storeSlug);
    const user = await this.getLocalUser(req.authUserId!);
    await this.getMembershipOrFail(user.id, store.id);

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.storeId !== store.id) {
      throw new NotFoundException("Product not found");
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category || category.storeId !== store.id) {
        throw new NotFoundException("Category not found");
      }
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        name: dto.name,
        description: dto.description,
        categoryId: dto.categoryId,
        status: dto.status,
        sortOrder: dto.sortOrder,
      },
      include: {
        category: true,
        portions: { orderBy: { sortOrder: "asc" } },
        extras: { orderBy: { sortOrder: "asc" } },
        images: { orderBy: { sortOrder: "asc" } },
      },
    });
  }

  // ── PATCH /stores/:storeSlug/products/:productId/portions/:portionId ──────────

  @Patch(":productId/portions/:portionId")
  @UseGuards(AuthGuard)
  async updatePortion(
    @Param("storeSlug") storeSlug: string,
    @Param("productId") productId: string,
    @Param("portionId") portionId: string,
    @Req() req: AuthRequest,
    @Body() body: { name?: string; price?: number; stock?: number },
  ) {
    const store = await this.getApprovedStore(storeSlug);
    const user = await this.getLocalUser(req.authUserId!);
    await this.getMembershipOrFail(user.id, store.id);

    const portion = await this.prisma.productPortion.findUnique({
      where: { id: portionId },
      include: { product: true },
    });
    if (!portion || portion.product.storeId !== store.id) {
      throw new NotFoundException("Portion not found");
    }

    return this.prisma.productPortion.update({
      where: { id: portionId },
      data: {
        name: body.name,
        price: body.price,
        stock: body.stock !== undefined ? this.resolveStock(body.stock) : undefined,
      },
    });
  }

  // ── POST /stores/:storeSlug/products/:productId/portions ──────────

  @Post(":productId/portions")
  @UseGuards(AuthGuard)
  async addPortion(
    @Param("storeSlug") storeSlug: string,
    @Param("productId") productId: string,
    @Req() req: AuthRequest,
    @Body() body: { name: string; price: number; stock?: number; sortOrder?: number },
  ) {
    const store = await this.getApprovedStore(storeSlug);
    const user = await this.getLocalUser(req.authUserId!);
    await this.getMembershipOrFail(user.id, store.id);

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.storeId !== store.id) throw new NotFoundException("Product not found");

    return this.prisma.productPortion.create({
      data: {
        productId,
        name: body.name,
        price: body.price,
        stock: this.resolveStock(body.stock),
        sortOrder: body.sortOrder ?? 0,
      },
    });
  }

  // ── DELETE /stores/:storeSlug/products/:productId/portions/:portionId ──────────

  @Delete(":productId/portions/:portionId")
  @UseGuards(AuthGuard)
  async deletePortion(
    @Param("storeSlug") storeSlug: string,
    @Param("productId") productId: string,
    @Param("portionId") portionId: string,
    @Req() req: AuthRequest,
  ) {
    const store = await this.getApprovedStore(storeSlug);
    const user = await this.getLocalUser(req.authUserId!);
    await this.getMembershipOrFail(user.id, store.id);

    const portion = await this.prisma.productPortion.findUnique({
      where: { id: portionId },
      include: { product: true },
    });
    if (!portion || portion.product.storeId !== store.id) throw new NotFoundException("Portion not found");

    await this.prisma.productPortion.delete({ where: { id: portionId } });
    return { deleted: true };
  }

  // ── PATCH /stores/:storeSlug/products/:productId/extras/:extraId ──────────

  @Patch(":productId/extras/:extraId")
  @UseGuards(AuthGuard)
  async updateExtra(
    @Param("storeSlug") storeSlug: string,
    @Param("productId") productId: string,
    @Param("extraId") extraId: string,
    @Req() req: AuthRequest,
    @Body() body: { name?: string; price?: number },
  ) {
    const store = await this.getApprovedStore(storeSlug);
    const user = await this.getLocalUser(req.authUserId!);
    await this.getMembershipOrFail(user.id, store.id);

    const extra = await this.prisma.productExtra.findUnique({
      where: { id: extraId },
      include: { product: true },
    });
    if (!extra || extra.product.storeId !== store.id) throw new NotFoundException("Extra not found");

    return this.prisma.productExtra.update({ where: { id: extraId }, data: body });
  }

  // ── POST /stores/:storeSlug/products/:productId/extras ──────────

  @Post(":productId/extras")
  @UseGuards(AuthGuard)
  async addExtra(
    @Param("storeSlug") storeSlug: string,
    @Param("productId") productId: string,
    @Req() req: AuthRequest,
    @Body() body: { name: string; price: number; sortOrder?: number },
  ) {
    const store = await this.getApprovedStore(storeSlug);
    const user = await this.getLocalUser(req.authUserId!);
    await this.getMembershipOrFail(user.id, store.id);

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.storeId !== store.id) throw new NotFoundException("Product not found");

    return this.prisma.productExtra.create({
      data: { productId, name: body.name, price: body.price, sortOrder: body.sortOrder ?? 0 },
    });
  }

  // ── DELETE /stores/:storeSlug/products/:productId/extras/:extraId ──────────

  @Delete(":productId/extras/:extraId")
  @UseGuards(AuthGuard)
  async deleteExtra(
    @Param("storeSlug") storeSlug: string,
    @Param("productId") productId: string,
    @Param("extraId") extraId: string,
    @Req() req: AuthRequest,
  ) {
    const store = await this.getApprovedStore(storeSlug);
    const user = await this.getLocalUser(req.authUserId!);
    await this.getMembershipOrFail(user.id, store.id);

    const extra = await this.prisma.productExtra.findUnique({
      where: { id: extraId },
      include: { product: true },
    });
    if (!extra || extra.product.storeId !== store.id) throw new NotFoundException("Extra not found");

    await this.prisma.productExtra.delete({ where: { id: extraId } });
    return { deleted: true };
  }

  // ── POST /stores/:storeSlug/products/:productId/images ──────────

  @Post(":productId/images")
  @UseGuards(AuthGuard)
  async addProductImage(
    @Param("storeSlug") storeSlug: string,
    @Param("productId") productId: string,
    @Req() req: AuthRequest,
    @Body() body: { url: string; altText?: string; sortOrder?: number },
  ) {
    const store = await this.getApprovedStore(storeSlug);
    const user = await this.getLocalUser(req.authUserId!);
    await this.getMembershipOrFail(user.id, store.id);
  
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product || product.storeId !== store.id) {
      throw new NotFoundException("Product not found");
    }
  
    return this.prisma.productImage.create({
      data: {
        productId,
        url: body.url,
        altText: body.altText,
        sortOrder: body.sortOrder ?? 0,
      },
    });
  }

  // ── DELETE /stores/:storeSlug/products/:productId/images/:imageId ──────────
  
  @Delete(":productId/images/:imageId")
  @UseGuards(AuthGuard)
  async deleteProductImage(
    @Param("storeSlug") storeSlug: string,
    @Param("productId") productId: string,
    @Param("imageId") imageId: string,
    @Req() req: AuthRequest,
  ) {
    const store = await this.getApprovedStore(storeSlug);
    const user = await this.getLocalUser(req.authUserId!);
    await this.getMembershipOrFail(user.id, store.id);
  
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId },
      include: { product: true },
    });
    if (!image || image.product.storeId !== store.id) {
      throw new NotFoundException("Image not found");
    }
  
    await this.prisma.productImage.delete({ where: { id: imageId } });
    return { deleted: true };
  }
}