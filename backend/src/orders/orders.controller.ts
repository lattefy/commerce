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
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthRequest } from "../auth/auth.types";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";

@Controller("stores/:storeSlug/orders")
export class OrdersController {
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

  private async getLocalUser(authUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { authUserId },
    });
    if (!user) throw new NotFoundException("User profile not found");
    return user;
  }

  private async getStaffMembership(userId: string, storeId: string) {
    const membership = await this.prisma.storeMembership.findUnique({
      where: { userId_storeId: { userId, storeId } },
    });
    if (!membership) throw new ForbiddenException("Not a member of this store");
    return membership;
  }

  // ── GET /stores/:storeSlug/orders ─────────────────────────

  @Get()
  @UseGuards(AuthGuard)
  async getOrders(
    @Param("storeSlug") storeSlug: string,
    @Req() req: AuthRequest,
  ) {
    const store = await this.getApprovedStore(storeSlug);
    const user = await this.getLocalUser(req.authUserId!);
    await this.getStaffMembership(user.id, store.id);

    return this.prisma.order.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: { extras: true },
        },
      },
    });
  }

  // ── GET /stores/:storeSlug/orders/my ───────────────────────

  @Get("my")
  @UseGuards(AuthGuard)
  async getMyOrders(
    @Param("storeSlug") storeSlug: string,
    @Req() req: AuthRequest,
  ) {
    const store = await this.getApprovedStore(storeSlug);
    const user = await this.getLocalUser(req.authUserId!);

    return this.prisma.order.findMany({
      where: {
        storeId: store.id,
        userId: user.id,
      },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: { extras: true },
        },
      },
    });
  }

  // ── GET /stores/:storeSlug/orders/:orderId ────────────────

  @Get(":orderId")
  @UseGuards(AuthGuard)
  async getOrder(
    @Param("storeSlug") storeSlug: string,
    @Param("orderId") orderId: string,
    @Req() req: AuthRequest,
  ) {
    const store = await this.getApprovedStore(storeSlug);
    const user = await this.getLocalUser(req.authUserId!);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { extras: true },
        },
      },
    });

    if (!order || order.storeId !== store.id) {
      throw new NotFoundException("Order not found");
    }

    const isOwner = order.userId === user.id;
    const membership = await this.prisma.storeMembership.findUnique({
      where: { userId_storeId: { userId: user.id, storeId: store.id } },
    });

    if (!isOwner && !membership) {
      throw new ForbiddenException("Access denied");
    }

    return order;
  }

  // ── POST /stores/:storeSlug/orders ────────────────────────

  @Post()
  @UseGuards(AuthGuard)
  async createOrder(
    @Param("storeSlug") storeSlug: string,
    @Req() req: AuthRequest,
    @Body() dto: CreateOrderDto,
  ) {
    const store = await this.getApprovedStore(storeSlug);
    const user = await this.getLocalUser(req.authUserId!);

    const orderType = dto.orderType ?? (store.allowsPickup ? "PICKUP" : "DELIVERY");

    if (orderType === "PICKUP" && !store.allowsPickup) {
      throw new BadRequestException("This store does not allow pickup orders");
    }
    if (orderType === "DELIVERY" && !store.allowsDelivery) {
      throw new BadRequestException("This store does not allow delivery orders");
    }

    const portionIds = dto.items.map((i) => i.portionId);
    const extraIds = dto.items.flatMap((i) => i.extras?.map((e) => e.extraId) ?? []);

    const portions = await this.prisma.productPortion.findMany({
      where: { id: { in: portionIds } },
      include: { product: true },
    });

    const extras = extraIds.length
      ? await this.prisma.productExtra.findMany({
          where: { id: { in: extraIds } },
        })
      : [];

    for (const item of dto.items) {
      const portion = portions.find((p) => p.id === item.portionId);

      if (!portion) {
        throw new NotFoundException(`Portion ${item.portionId} not found`);
      }
      if (portion.product.storeId !== store.id) {
        throw new BadRequestException(`Portion ${item.portionId} does not belong to this store`);
      }
      if (portion.product.status !== "AVAILABLE") {
        throw new BadRequestException(`Product "${portion.product.name}" is not available`);
      }
      // -1 = infinite stock, skip validation. 0+ = finite stock.
      if (portion.stock !== -1 && portion.stock < item.quantity) {
        throw new BadRequestException(`Not enough stock for "${portion.name}"`);
      }

      for (const extra of item.extras ?? []) {
        const extraRecord = extras.find((e) => e.id === extra.extraId);
        if (!extraRecord) {
          throw new NotFoundException(`Extra ${extra.extraId} not found`);
        }
        if (extraRecord.productId !== portion.productId) {
          throw new BadRequestException(`Extra ${extra.extraId} does not belong to this product`);
        }
        if (extra.quantity > extraRecord.maxQty) {
          throw new BadRequestException(`Max quantity for "${extraRecord.name}" is ${extraRecord.maxQty}`);
        }
      }
    }

    let total = 0;
    for (const item of dto.items) {
      const portion = portions.find((p) => p.id === item.portionId)!;
      total += portion.price * item.quantity;
      for (const extra of item.extras ?? []) {
        const extraRecord = extras.find((e) => e.id === extra.extraId)!;
        total += extraRecord.price * extra.quantity;
      }
    }

    const order = await this.prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        const portion = portions.find((p) => p.id === item.portionId)!;
        // Only decrement finite stock
        if (portion.stock !== -1) {
          await tx.productPortion.update({
            where: { id: portion.id },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      return tx.order.create({
        data: {
          storeId: store.id,
          userId: user.id,
          total,
          notes: dto.notes,
          orderType,
          addressId: dto.addressId,
          items: {
            create: dto.items.map((item) => {
              const portion = portions.find((p) => p.id === item.portionId)!;
              return {
                productId: portion.productId,
                productName: portion.product.name,
                portionId: portion.id,
                portionName: portion.name,
                unitPrice: portion.price,
                quantity: item.quantity,
                extras: {
                  create: (item.extras ?? []).map((extra) => {
                    const extraRecord = extras.find((e) => e.id === extra.extraId)!;
                    return {
                      extraId: extraRecord.id,
                      extraName: extraRecord.name,
                      unitPrice: extraRecord.price,
                      quantity: extra.quantity,
                    };
                  }),
                },
              };
            }),
          },
        },
        include: {
          items: {
            include: { extras: true },
          },
        },
      });
    });

    return order;
  }

  // ── POST /stores/:storeSlug/orders/:orderId/confirm-payment ──

  @Post(":orderId/confirm-payment")
  @UseGuards(AuthGuard)
  async confirmPayment(
    @Param("storeSlug") storeSlug: string,
    @Param("orderId") orderId: string,
    @Req() req: AuthRequest,
    @Body() body: { paymentId: string },
  ) {
    const store = await this.prisma.store.findUnique({
      where: { slug: storeSlug },
      include: { paymentSettings: true },
    });

    if (!store || store.status !== "APPROVED") {
      throw new NotFoundException("Store not found");
    }

    if (!store.paymentSettings?.isConnected) {
      throw new BadRequestException("Store has not connected Mercado Pago");
    }

    const user = await this.getLocalUser(req.authUserId!);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.storeId !== store.id) {
      throw new NotFoundException("Order not found");
    }

    if (order.userId !== user.id) {
      throw new ForbiddenException("Access denied");
    }

    // Si ya está pagada (webhook llegó primero), retornar sin error
    if (order.status === "PAID") {
      return { ok: true, status: "PAID" };
    }

    if (order.status !== "PENDING") {
      throw new BadRequestException(`Order is in status ${order.status}`);
    }

    // Verificar el pago con el token de la tienda
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${body.paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${store.paymentSettings.mpAccessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new BadRequestException("Could not verify payment with Mercado Pago");
    }

    const payment = await response.json();

    if (payment.external_reference !== orderId) {
      throw new BadRequestException("Payment does not match this order");
    }

    if (payment.status !== "approved") {
      throw new BadRequestException(`Payment status is ${payment.status}`);
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        mpPaymentId: String(body.paymentId),
      },
    });

    return { ok: true, status: "PAID" };
  }

  // ── PATCH /stores/:storeSlug/orders/:orderId/status ───────

  @Patch(":orderId/status")
  @UseGuards(AuthGuard)
  async updateOrderStatus(
    @Param("storeSlug") storeSlug: string,
    @Param("orderId") orderId: string,
    @Req() req: AuthRequest,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const store = await this.getApprovedStore(storeSlug);
    const user = await this.getLocalUser(req.authUserId!);
    await this.getStaffMembership(user.id, store.id);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.storeId !== store.id) {
      throw new NotFoundException("Order not found");
    }

    const validTransitions: Record<string, string[]> = {
      PENDING: ["PAID", "CANCELLED"],
      PAID: ["PREPARING", "CANCELLED"],
      PREPARING: ["READY", "CANCELLED"],
      READY: ["OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"],
      OUT_FOR_DELIVERY: ["COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[order.status].includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status },
      include: {
        items: { include: { extras: true } },
      },
    });
    
    if (dto.status === "COMPLETED") {
      const settings = await this.prisma.storeLoyaltySettings.findUnique({
        where: { storeId: store.id },
      });
    
      const pesosPerPoint = settings?.pesosPerPoint ?? 20;
      const maxPointsPerOrder = settings?.maxPointsPerOrder ?? null;
    
      const raw = Math.floor(order.total / pesosPerPoint);
      const points = maxPointsPerOrder !== null ? Math.min(raw, maxPointsPerOrder) : raw;
    
      if (points > 0) {
        const expiresAt = settings?.pointsExpiryDays
          ? new Date(Date.now() + settings.pointsExpiryDays * 24 * 60 * 60 * 1000)
          : null;
    
        await this.prisma.loyaltyLedgerEntry.create({
          data: {
            storeId: store.id,
            userId: order.userId,
            type: "EARN",
            points,
            orderId: order.id,
            expiresAt,
          },
        });
      }
    }
    
    return updated;
  }
}