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
  import { UpsertLoyaltySettingsDto } from "./dto/upsert-loyalty-settings.dto";
  import { CreateRewardDto } from "./dto/create-reward.dto";
  import { RedeemRewardDto } from "./dto/redeem-reward.dto";
  
  @Controller("stores/:storeSlug/loyalty")
  export class LoyaltyController {
    constructor(private readonly prisma: PrismaService) {}
  
    // ── Helpers ──────────────────────────────────────────────
  
    private async getApprovedStore(storeSlug: string) {
      const store = await this.prisma.store.findUnique({
        where: { slug: storeSlug },
        include: { loyaltySettings: true },
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
  
    private async getOwnerMembership(userId: string, storeId: string) {
      const membership = await this.prisma.storeMembership.findUnique({
        where: { userId_storeId: { userId, storeId } },
      });
      if (!membership) throw new ForbiddenException("Not a member of this store");
      if (membership.role !== "OWNER") throw new ForbiddenException("Owner access required");
      return membership;
    }
  
    private async getStaffMembership(userId: string, storeId: string) {
      const membership = await this.prisma.storeMembership.findUnique({
        where: { userId_storeId: { userId, storeId } },
      });
      if (!membership) throw new ForbiddenException("Not a member of this store");
      const isOwner = membership.role === "OWNER";
      if (!isOwner && !membership.canManageLoyalty) {
        throw new ForbiddenException("No permission to manage loyalty");
      }
      return membership;
    }
  
    private calculatePoints(total: number, settings: { pesosPerPoint: number; maxPointsPerOrder: number | null }): number {
      const raw = Math.floor(total / settings.pesosPerPoint);
      if (settings.maxPointsPerOrder !== null) {
        return Math.min(raw, settings.maxPointsPerOrder);
      }
      return raw;
    }
  
    // ── GET /stores/:storeSlug/loyalty/settings ───────────────
  
    @Get("settings")
    @UseGuards(AuthGuard)
    async getSettings(
      @Param("storeSlug") storeSlug: string,
      @Req() req: AuthRequest,
    ) {
      const store = await this.getApprovedStore(storeSlug);
      const user = await this.getLocalUser(req.authUserId!);
      await this.getStaffMembership(user.id, store.id);
  
      return store.loyaltySettings ?? { pesosPerPoint: 20, maxPointsPerOrder: null, pointsExpiryDays: null };
    }
  
    // ── POST /stores/:storeSlug/loyalty/settings ──────────────
  
    @Post("settings")
    @UseGuards(AuthGuard)
    async upsertSettings(
      @Param("storeSlug") storeSlug: string,
      @Req() req: AuthRequest,
      @Body() dto: UpsertLoyaltySettingsDto,
    ) {
      const store = await this.getApprovedStore(storeSlug);
      const user = await this.getLocalUser(req.authUserId!);
      await this.getOwnerMembership(user.id, store.id);
  
      return this.prisma.storeLoyaltySettings.upsert({
        where: { storeId: store.id },
        update: {
          pesosPerPoint: dto.pesosPerPoint,
          maxPointsPerOrder: dto.maxPointsPerOrder,
          pointsExpiryDays: dto.pointsExpiryDays,
        },
        create: {
          storeId: store.id,
          pesosPerPoint: dto.pesosPerPoint ?? 20,
          maxPointsPerOrder: dto.maxPointsPerOrder,
          pointsExpiryDays: dto.pointsExpiryDays,
        },
        include: { store: true },
      });
    }
  
    // ── GET /stores/:storeSlug/loyalty/rewards ────────────────
  
    @Get("rewards")
    async getRewards(@Param("storeSlug") storeSlug: string) {
      const store = await this.getApprovedStore(storeSlug);
  
      return this.prisma.reward.findMany({
        where: { storeId: store.id },
        orderBy: { pointsCost: "asc" },
        include: { product: { include: { portions: true } } },
      });
    }
  
    // ── POST /stores/:storeSlug/loyalty/rewards ───────────────
  
    @Post("rewards")
    @UseGuards(AuthGuard)
    async createReward(
      @Param("storeSlug") storeSlug: string,
      @Req() req: AuthRequest,
      @Body() dto: CreateRewardDto,
    ) {
      const store = await this.getApprovedStore(storeSlug);
      const user = await this.getLocalUser(req.authUserId!);
      await this.getStaffMembership(user.id, store.id);
  
      return this.prisma.reward.create({
        data: {
          storeId: store.id,
          name: dto.name,
          description: dto.description,
          type: dto.type,
          pointsCost: dto.pointsCost,
          discountValue: dto.discountValue ?? 0,
          productId: dto.productId,
          isActive: dto.isActive ?? true,
        },
        include: { product: true },
      });
    }
  
    // ── GET /stores/:storeSlug/loyalty/balance ────────────────
  
    @Get("balance")
    @UseGuards(AuthGuard)
    async getBalance(
      @Param("storeSlug") storeSlug: string,
      @Req() req: AuthRequest,
    ) {
      const store = await this.getApprovedStore(storeSlug);
      const user = await this.getLocalUser(req.authUserId!);
  
      const now = new Date();
  
      const result = await this.prisma.loyaltyLedgerEntry.aggregate({
        where: {
          storeId: store.id,
          userId: user.id,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ],
        },
        _sum: { points: true },
      });
  
      return { balance: result._sum.points ?? 0 };
    }
  
    // ── GET /stores/:storeSlug/loyalty/history ────────────────
  
    @Get("history")
    @UseGuards(AuthGuard)
    async getHistory(
      @Param("storeSlug") storeSlug: string,
      @Req() req: AuthRequest,
    ) {
      const store = await this.getApprovedStore(storeSlug);
      const user = await this.getLocalUser(req.authUserId!);
  
      return this.prisma.loyaltyLedgerEntry.findMany({
        where: { storeId: store.id, userId: user.id },
        orderBy: { createdAt: "desc" },
      });
    }
  
    // ── POST /stores/:storeSlug/loyalty/redeem ────────────────
  
    @Post("redeem")
    @UseGuards(AuthGuard)
    async redeemReward(
      @Param("storeSlug") storeSlug: string,
      @Req() req: AuthRequest,
      @Body() dto: RedeemRewardDto,
    ) {
      const store = await this.getApprovedStore(storeSlug);
      const user = await this.getLocalUser(req.authUserId!);
  
      const reward = await this.prisma.reward.findUnique({
        where: { id: dto.rewardId },
      });
  
      if (!reward || reward.storeId !== store.id || !reward.isActive) {
        throw new NotFoundException("Reward not found");
      }
  
      // Check balance
      const now = new Date();
      const result = await this.prisma.loyaltyLedgerEntry.aggregate({
        where: {
          storeId: store.id,
          userId: user.id,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ],
        },
        _sum: { points: true },
      });
  
      const balance = result._sum.points ?? 0;
  
      if (balance < reward.pointsCost) {
        throw new BadRequestException(
          `Insufficient points. Need ${reward.pointsCost}, have ${balance}`,
        );
      }
  
      // Create redemption + negative ledger entry in transaction
      const redemption = await this.prisma.$transaction(async (tx) => {
        const redemption = await tx.rewardRedemption.create({
          data: {
            storeId: store.id,
            userId: user.id,
            rewardId: reward.id,
          },
        });
  
        await tx.loyaltyLedgerEntry.create({
          data: {
            storeId: store.id,
            userId: user.id,
            type: "REDEEM",
            points: -reward.pointsCost,
            redemptionId: redemption.id,
          },
        });
  
        return redemption;
      });
  
      return {
        redeemed: true,
        reward,
        redemption,
        pointsSpent: reward.pointsCost,
        newBalance: balance - reward.pointsCost,
      };
    }

    // ── PATCH /stores/:storeSlug/loyalty/rewards/:rewardId ───────────────

    @Patch("rewards/:rewardId")
    @UseGuards(AuthGuard)
    async updateReward(
      @Param("storeSlug") storeSlug: string,
      @Param("rewardId") rewardId: string,
      @Req() req: AuthRequest,
      @Body() body: { isActive?: boolean; name?: string; description?: string; pointsCost?: number; discountValue?: number },
    ) {
      const store = await this.getApprovedStore(storeSlug);
      const user = await this.getLocalUser(req.authUserId!);
      await this.getStaffMembership(user.id, store.id);
    
      const reward = await this.prisma.reward.findUnique({ where: { id: rewardId } });
      if (!reward || reward.storeId !== store.id) throw new NotFoundException("Reward not found");
    
      return this.prisma.reward.update({ where: { id: rewardId }, data: body });
    }

    // ── GET /stores/:storeSlug/loyalty/rewards/all ────────────────
    
    @Get("rewards/all")
    @UseGuards(AuthGuard)
    async getAllRewards(
      @Param("storeSlug") storeSlug: string,
      @Req() req: AuthRequest,
    ) {
      const store = await this.getApprovedStore(storeSlug);
      const user = await this.getLocalUser(req.authUserId!);
      await this.getStaffMembership(user.id, store.id);
    
      return this.prisma.reward.findMany({
        where: { storeId: store.id },
        orderBy: { pointsCost: "asc" },
      });
    }

    // ── POST /stores/:storeSlug/loyalty/adjust/:userId ────────────────

    @Post("adjust/:userId")
    @UseGuards(AuthGuard)
    async adjustPoints(
      @Param("storeSlug") storeSlug: string,
      @Param("userId") userId: string,
      @Req() req: AuthRequest,
      @Body() body: { points: number; reason?: string },
    ) {
      const store = await this.getApprovedStore(storeSlug);
      const user = await this.getLocalUser(req.authUserId!);
      await this.getStaffMembership(user.id, store.id);

      if (body.points === 0) throw new BadRequestException("Points cannot be zero");

      const targetUser = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!targetUser) throw new NotFoundException("User not found");

      return this.prisma.loyaltyLedgerEntry.create({
        data: {
          storeId: store.id,
          userId,
          type: "ADJUST",
          points: body.points,
        },
      });
    }

  }