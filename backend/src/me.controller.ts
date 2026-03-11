import { Controller, Get, Patch, Body, UseGuards, Req } from "@nestjs/common";
import { AuthGuard } from "./auth/auth.guard";
import type { AuthRequest } from "./auth/auth.types";
import { PrismaService } from "./prisma/prisma.service";

@Controller()
export class MeController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(AuthGuard)
  @Get("me")
  async me(@Req() req: AuthRequest) {
    const authUserId = req.authUserId;

    if (!authUserId) {
      return { authUserId: null, user: null, memberships: [] };
    }

    const user = await this.prisma.user.findUnique({
      where: { authUserId },
      include: {
        memberships: {
          include: {
            store: true,
          },
        },
      },
    });

    return {
      authUserId,
      user,
      memberships: user?.memberships ?? [],
    };
  }

  @UseGuards(AuthGuard)
  @Get("me/orders")
  async myOrders(@Req() req: AuthRequest) {
    const user = await this.prisma.user.findUnique({
      where: { authUserId: req.authUserId! },
    });

    if (!user) return [];

    return this.prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        store: {
          select: {
            name: true,
            slug: true,
            branding: true,
          },
        },
        items: {
          include: { extras: true },
        },
      },
    });
  }

  @UseGuards(AuthGuard)
  @Get("me/loyalty")
  async myLoyalty(@Req() req: AuthRequest) {
    const user = await this.prisma.user.findUnique({
      where: { authUserId: req.authUserId! },
    });

    if (!user) return [];

    const now = new Date();

    const entries = await this.prisma.loyaltyLedgerEntry.groupBy({
      by: ["storeId"],
      where: {
        userId: user.id,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      _sum: { points: true },
    });

    if (entries.length === 0) return [];

    const storeIds = entries.map((e) => e.storeId);

    const stores = await this.prisma.store.findMany({
      where: { id: { in: storeIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        branding: true,
        loyaltySettings: true,
        rewards: {
          where: { isActive: true },
          orderBy: { pointsCost: "asc" },
        },
      },
    });

    return entries
      .map((entry) => {
        const store = stores.find((s) => s.id === entry.storeId);
        return {
          store,
          points: entry._sum.points ?? 0,
        };
      })
      .filter((e) => e.points > 0 && e.store)
      .sort((a, b) => b.points - a.points);
  }

  @UseGuards(AuthGuard)
  @Patch("me")
  async updateMe(
    @Req() req: AuthRequest,
    @Body() body: { name?: string; phone?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { authUserId: req.authUserId! },
    });

    if (!user) return null;

    return this.prisma.user.update({
      where: { authUserId: req.authUserId! },
      data: {
        name: body.name,
        phone: body.phone,
      },
    });
  }
}