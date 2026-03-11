import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthRequest } from "../auth/auth.types";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Controller("stores/:storeSlug/categories")
export class CategoriesController {
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

  private async getMembership(userId: string, storeId: string) {
    return this.prisma.storeMembership.findUnique({
      where: { userId_storeId: { userId, storeId } },
    });
  }

  // ── GET /stores/:storeSlug/categories ────────────────────

  @Get()
  async getCategories(@Param("storeSlug") storeSlug: string) {
    const store = await this.getApprovedStore(storeSlug);

    return this.prisma.category.findMany({
      where: { storeId: store.id, parentId: null },
      orderBy: { sortOrder: "asc" },
      include: {
        children: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  }

  // ── POST /stores/:storeSlug/categories ───────────────────

  @Post()
  @UseGuards(AuthGuard)
  async createCategory(
    @Param("storeSlug") storeSlug: string,
    @Req() req: AuthRequest,
    @Body() dto: CreateCategoryDto,
  ) {
    const store = await this.getApprovedStore(storeSlug);

    const user = await this.prisma.user.findUnique({
      where: { authUserId: req.authUserId },
    });
    if (!user) throw new NotFoundException("User profile not found");

    const membership = await this.getMembership(user.id, store.id);
    if (!membership) throw new ForbiddenException("Not a member of this store");

    const isOwner = membership.role === "OWNER";
    if (!isOwner && !membership.canManageProducts) {
      throw new ForbiddenException("No permission to manage products");
    }

    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent || parent.storeId !== store.id) {
        throw new NotFoundException("Parent category not found");
      }
      if (parent.parentId) {
        throw new ForbiddenException("Cannot nest more than one level deep");
      }
    }

    return this.prisma.category.create({
      data: {
        storeId: store.id,
        name: dto.name,
        description: dto.description,
        parentId: dto.parentId,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: { children: true },
    });
  }

  // ── PATCH /stores/:storeSlug/categories/:categoryId ──────

  @Patch(":categoryId")
  @UseGuards(AuthGuard)
  async updateCategory(
    @Param("storeSlug") storeSlug: string,
    @Param("categoryId") categoryId: string,
    @Req() req: AuthRequest,
    @Body() dto: UpdateCategoryDto,
  ) {
    const store = await this.getApprovedStore(storeSlug);

    const user = await this.prisma.user.findUnique({
      where: { authUserId: req.authUserId },
    });
    if (!user) throw new NotFoundException("User profile not found");

    const membership = await this.getMembership(user.id, store.id);
    if (!membership) throw new ForbiddenException("Not a member of this store");

    const isOwner = membership.role === "OWNER";
    if (!isOwner && !membership.canManageProducts) {
      throw new ForbiddenException("No permission to manage products");
    }

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category || category.storeId !== store.id) {
      throw new NotFoundException("Category not found");
    }

    return this.prisma.category.update({
      where: { id: categoryId },
      data: dto,
      include: { children: true },
    });
  }
}