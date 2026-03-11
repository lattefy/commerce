import { Body, Controller, Post, Get, Patch, Param, UseGuards, Req, ConflictException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthRequest } from "../auth/auth.types";
import { RequestStoreDto } from "./dto/request-store.dto";
import { UpdateStoreDto } from "./dto/update-store.dto";

@Controller("stores")
export class StoresController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("my")
  @UseGuards(AuthGuard)
  async getMyStores(@Req() req: AuthRequest) {
    const user = await this.prisma.user.findUnique({
      where: { authUserId: req.authUserId },
      include: {
        memberships: {
          include: { store: true },
        },
      },
    });

    if (!user) throw new NotFoundException("User not found");

    return user.memberships.map((m) => ({
      ...m.store,
      role: m.role,
    }));
  }

  @Get("my/:slug")
  @UseGuards(AuthGuard)
  async getMyStore(
    @Param("slug") slug: string,
    @Req() req: AuthRequest,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { authUserId: req.authUserId },
    });
    if (!user) throw new NotFoundException("User not found");
  
    const membership = await this.prisma.storeMembership.findFirst({
      where: { userId: user.id, store: { slug } },
      include: { store: true },
    });
  
    if (!membership) throw new NotFoundException("Store not found");
  
    const { userId, storeId, role, createdAt, updatedAt, id, store, ...permissions } = membership;
  
    return { ...store, role, permissions };
  }

  @Patch("my/:slug")
  @UseGuards(AuthGuard)
  async updateMyStore(
    @Param("slug") slug: string,
    @Req() req: AuthRequest,
    @Body() dto: UpdateStoreDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { authUserId: req.authUserId },
    });
    if (!user) throw new NotFoundException("User not found");
  
    const membership = await this.prisma.storeMembership.findFirst({
      where: { userId: user.id, store: { slug } },
      include: { store: true },
    });
  
    if (!membership) throw new NotFoundException("Store not found");
  
    const isOwner = membership.role === "OWNER";
    const canManageOperations = membership.canManageOperations;
  
    if (!isOwner && !canManageOperations) {
      throw new ForbiddenException("No tenés permisos para actualizar esta tienda");
    }
  
    // Campos exclusivos de owner
    const ownerOnlyFields = [
      "name", "description", "phone", "instagram", "website",
      "address", "city", "deliveryZone", "allowsPickup", "allowsDelivery",
      "schedule", "branding",
    ];
  
    if (!isOwner) {
      const forbiddenFields = ownerOnlyFields.filter((field) => dto[field as keyof UpdateStoreDto] !== undefined);
      if (forbiddenFields.length > 0) {
        throw new ForbiddenException(`No tenés permisos para modificar: ${forbiddenFields.join(", ")}`);
      }
    }
  
    const updated = await this.prisma.store.update({
      where: { slug },
      data: dto,
    });
  
    const { userId, storeId, role, createdAt, updatedAt, id, store, ...permissions } = membership;
  
    return { ...updated, role, permissions };
  }

  @Get()
  async getAllStores() {
    return this.prisma.store.findMany({
      where: { status: "APPROVED" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        city: true,
        branding: true,
        allowsPickup: true,
        allowsDelivery: true,
      },
      orderBy: { name: "asc" },
    });
  }

  @Get(":storeSlug")
  async getStore(@Param("storeSlug") storeSlug: string) {
    const store = await this.prisma.store.findUnique({
      where: { slug: storeSlug },
    });

    if (!store || store.status !== "APPROVED") {
      throw new NotFoundException("Store not found");
    }

    return store;
  }

  @UseGuards(AuthGuard)
  @Post("request")
  async requestStore(@Req() req: AuthRequest, @Body() body: RequestStoreDto) {
    const authUserId = req.authUserId!;

    const user = await this.prisma.user.findUnique({
      where: { authUserId },
    });

    if (!user) {
      throw new NotFoundException("User profile not found. Complete onboarding first.");
    }

    const existingSlug = await this.prisma.store.findUnique({
      where: { slug: body.slug },
    });

    if (existingSlug) {
      throw new ConflictException(`Slug "${body.slug}" is already taken.`);
    }

    const store = await this.prisma.store.create({
      data: {
        name: body.name,
        slug: body.slug,
        requestedByUserId: user.id,
        memberships: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });

    return { requested: true, store };
  }

  @Get("my/:slug/customers")
  @UseGuards(AuthGuard)
  async getStoreCustomers(
    @Param("slug") slug: string,
    @Req() req: AuthRequest,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { authUserId: req.authUserId },
    });
    if (!user) throw new NotFoundException("User not found");

    const membership = await this.prisma.storeMembership.findFirst({
      where: { userId: user.id, store: { slug } },
      include: { store: true },
    });
    if (!membership) throw new NotFoundException("Store not found");

    const store = membership.store;

    // Obtener todos los usuarios que hicieron órdenes en esta tienda
    const orders = await this.prisma.order.findMany({
      where: { storeId: store.id },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    // Agrupar por usuario
    const customerMap = new Map<string, any>();

    for (const order of orders) {
      if (!customerMap.has(order.userId)) {
        customerMap.set(order.userId, {
          id: order.user.id,
          name: order.user.name,
          email: order.user.email,
          phone: order.user.phone,
          totalOrders: 0,
          totalSpent: 0,
          lastOrderAt: null,
        });
      }
      const customer = customerMap.get(order.userId);
      customer.totalOrders += 1;
      if (["PAID", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED"].includes(order.status)) {
        customer.totalSpent += order.total;
      }
      if (!customer.lastOrderAt || order.createdAt > customer.lastOrderAt) {
        customer.lastOrderAt = order.createdAt;
      }
    }

    // Agregar puntos de loyalty
    const customerIds = Array.from(customerMap.keys());
    if (customerIds.length > 0) {
      const now = new Date();
      const loyaltyEntries = await this.prisma.loyaltyLedgerEntry.groupBy({
        by: ["userId"],
        where: {
          storeId: store.id,
          userId: { in: customerIds },
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        _sum: { points: true },
      });

      for (const entry of loyaltyEntries) {
        const customer = customerMap.get(entry.userId);
        if (customer) customer.loyaltyPoints = entry._sum.points ?? 0;
      }
    }

    return Array.from(customerMap.values())
      .map((c) => ({ ...c, loyaltyPoints: c.loyaltyPoints ?? 0 }))
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }

}