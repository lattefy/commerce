import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import type { Response } from "express";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthRequest } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { PaymentService } from "./payment.service";
import { JwksService } from "../auth/jwks.service";

@Controller()
export class PaymentController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly jwksService: JwksService,
  ) {}

  // ── GET /stores/:storeSlug/payment/status ─────────────────

  @Get("stores/:storeSlug/payment/status")
  @UseGuards(AuthGuard)
  async getPaymentStatus(
    @Param("storeSlug") storeSlug: string,
    @Req() req: AuthRequest,
  ) {
    const store = await this.prisma.store.findUnique({
      where: { slug: storeSlug },
    });
    if (!store || store.status !== "APPROVED") {
      throw new NotFoundException("Store not found");
    }

    const user = await this.prisma.user.findUnique({
      where: { authUserId: req.authUserId },
    });
    if (!user) throw new NotFoundException("User profile not found");

    const membership = await this.prisma.storeMembership.findUnique({
      where: { userId_storeId: { userId: user.id, storeId: store.id } },
    });
    if (!membership) throw new ForbiddenException("Not a member of this store");

    const settings = await this.prisma.storePaymentSettings.findUnique({
      where: { storeId: store.id },
    });

    return {
      isConnected: settings?.isConnected ?? false,
      mpUserId: settings?.mpUserId ?? null,
    };
  }

  // ── GET /stores/:storeSlug/payment/connect ────────────────

  @Get("stores/:storeSlug/payment/connect")
  async connectMp(
    @Param("storeSlug") storeSlug: string,
    @Query("token") token: string,
    @Req() req: AuthRequest,
    @Res() res: Response,
  ) {
    if (!token) throw new UnauthorizedException("Missing token");

    const { jwtVerify } = await import("jose");
    const jwks = this.jwksService.getJwks();
    let authUserId: string;
    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL}/auth/v1` : undefined,
      });
      if (!payload.sub) throw new Error("Missing sub");
      authUserId = payload.sub;
    } catch {
      throw new UnauthorizedException("Invalid token");
    }

    const store = await this.prisma.store.findUnique({
      where: { slug: storeSlug },
    });
    if (!store || store.status !== "APPROVED") {
      throw new NotFoundException("Store not found");
    }

    const user = await this.prisma.user.findUnique({
      where: { authUserId },
    });
    if (!user) throw new NotFoundException("User profile not found");

    const membership = await this.prisma.storeMembership.findUnique({
      where: { userId_storeId: { userId: user.id, storeId: store.id } },
    });
    if (!membership || membership.role !== "OWNER") {
      throw new ForbiddenException("Owner access required");
    }

    const url = this.paymentService.getOAuthUrl(store.id);
    return res.redirect(url);
  }

  // ── GET /payment/callback ─────────────────────────────────

  @Get("payment/callback")
  async mpCallback(
    @Query("code") code: string,
    @Query("state") storeId: string,
    @Res() res: Response,
  ) {
    if (!code || !storeId) {
      throw new BadRequestException("Missing code or state");
    }

    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) throw new NotFoundException("Store not found");

    const tokens = await this.paymentService.exchangeCodeForTokens(code);

    await this.prisma.storePaymentSettings.upsert({
      where: { storeId: store.id },
      update: {
        mpAccessToken: tokens.access_token,
        mpRefreshToken: tokens.refresh_token,
        mpUserId: String(tokens.user_id),
        mpPublicKey: tokens.public_key,
        isConnected: true,
      },
      create: {
        storeId: store.id,
        mpAccessToken: tokens.access_token,
        mpRefreshToken: tokens.refresh_token,
        mpUserId: String(tokens.user_id),
        mpPublicKey: tokens.public_key,
        isConnected: true,
      },
    });

    return res.redirect(`${process.env.FRONTEND_URL}/dashboard/stores/${store.slug}/payments?mp=connected`);
  }

  // ── POST /payment/webhook ─────────────────────────────────

  // @Post("payment/webhook")
  // async mpWebhook(@Body() body: any) {
  //   if (body.type !== "payment") return { ok: true };

  //   const paymentId = body.data?.id;
  //   if (!paymentId) return { ok: true };

  //   const response = await fetch(
  //     `https://api.mercadopago.com/v1/payments/${paymentId}`,
  //     {
  //       headers: {
  //         Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
  //       },
  //     },
  //   );

  //   if (!response.ok) return { ok: true };

  //   const payment = await response.json();
  //   if (payment.status !== "approved") return { ok: true };

  //   const orderId = payment.external_reference;
  //   if (!orderId) return { ok: true };

  //   const order = await this.prisma.order.findUnique({
  //     where: { id: orderId },
  //   });

  //   if (!order || order.status !== "PENDING") return { ok: true };

  //   await this.prisma.order.update({
  //     where: { id: orderId },
  //     data: { status: "PAID" },
  //   });

  //   return { ok: true };
  // }

  @Post("payment/webhook")
  async mpWebhook(@Body() body: any) {
    if (body.type !== "payment") return { ok: true };

    const paymentId = String(body.data?.id);
    if (!paymentId) return { ok: true };

    // Si ya fue procesado por confirm-payment, ignorar
    const alreadyProcessed = await this.prisma.order.findFirst({
      where: { mpPaymentId: paymentId },
    });
    if (alreadyProcessed) return { ok: true };

    // Buscar la tienda por mpUserId (user_id del webhook es el seller)
    const mpUserId = String(body.user_id);
    const paymentSettings = mpUserId
      ? await this.prisma.storePaymentSettings.findFirst({
          where: { mpUserId },
        })
      : null;

    const accessToken = paymentSettings?.mpAccessToken ?? process.env.MP_ACCESS_TOKEN!;

    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) return { ok: true };

    const payment = await response.json();
    if (payment.status !== "approved") return { ok: true };

    const orderId = payment.external_reference;
    if (!orderId) return { ok: true };

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.status !== "PENDING") return { ok: true };

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        mpPaymentId: paymentId,
      },
    });

    return { ok: true };
  }

  // ── POST /stores/:storeSlug/payment/preference ────────────

  @Post("stores/:storeSlug/payment/preference")
  @UseGuards(AuthGuard)
  async createPreference(
    @Param("storeSlug") storeSlug: string,
    @Query("orderId") orderId: string,
    @Req() req: AuthRequest,
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

    const user = await this.prisma.user.findUnique({
      where: { authUserId: req.authUserId },
    });
    if (!user) throw new NotFoundException("User profile not found");

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { extras: true } } },
    });

    if (!order || order.storeId !== store.id) {
      throw new NotFoundException("Order not found");
    }

    if (order.userId !== user.id) {
      throw new ForbiddenException("Access denied");
    }

    if (order.status !== "PENDING") {
      throw new BadRequestException("Order is not pending payment");
    }

    const items = order.items.map((item, index) => ({
      id: String(index + 1),
      title: `${item.productName} - ${item.portionName}`,
      unit_price: Math.round(item.unitPrice / 100),
      quantity: item.quantity,
    }));

    const baseUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

    const preference = await this.paymentService.createPreference(
      store.paymentSettings.mpAccessToken,
      {
        orderId: order.id,
        storeSlug: store.slug,
        items,
        backUrls: {
          success: `${baseUrl}/${store.slug}/orders/${order.id}?status=success`,
          failure: `${baseUrl}/${store.slug}/orders/${order.id}?status=failure`,
          pending: `${baseUrl}/${store.slug}/orders/${order.id}?status=pending`,
        },
      },
    );

    return {
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
    };
  }

  @Post("payment/webhook/test")
  async testWebhook(@Body() body: { orderId: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id: body.orderId },
    });

    if (!order || order.status !== "PENDING") {
      return { ok: false, reason: "Order not found or not pending" };
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID" },
    });

    return { ok: true, orderId: order.id, newStatus: "PAID" };
  }
}