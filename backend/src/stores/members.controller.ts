import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Req,
    NotFoundException,
    ForbiddenException,
    ConflictException,
  } from "@nestjs/common";
  import { PrismaService } from "../prisma/prisma.service";
  import { AuthGuard } from "../auth/auth.guard";
  import type { AuthRequest } from "../auth/auth.types";
  import { AddMemberDto } from "./dto/add-member.dto";
  import { UpdateMemberDto } from "./dto/update-member.dto";
  
  @Controller("stores/:slug/members")
  export class MembersController {
    constructor(private readonly prisma: PrismaService) {}
  
    // ── Helpers ──────────────────────────────────────────────
  
    private async getLocalUser(authUserId: string) {
      const user = await this.prisma.user.findUnique({ where: { authUserId } });
      if (!user) throw new NotFoundException("User not found");
      return user;
    }
  
    private async getOwnerMembership(userId: string, slug: string) {
      const membership = await this.prisma.storeMembership.findFirst({
        where: { userId, store: { slug } },
        include: { store: true },
      });
      if (!membership) throw new NotFoundException("Store not found");
      if (membership.role !== "OWNER") throw new ForbiddenException("Owner access required");
      return membership;
    }
  
    private formatMember(m: any) {
      return {
        id: m.id,
        user: m.user,
        canManageProducts: m.canManageProducts,
        canManageOrders: m.canManageOrders,
        canManageLoyalty: m.canManageLoyalty,
        canManageEmployees: m.canManageEmployees,
        canViewAnalytics: m.canViewAnalytics,
        canManageOperations: m.canManageOperations,
      };
    }
  
    // ── GET /stores/:slug/members ─────────────────────────────
  
    @Get()
    @UseGuards(AuthGuard)
    async getMembers(
      @Param("slug") slug: string,
      @Req() req: AuthRequest,
    ) {
      const user = await this.getLocalUser(req.authUserId!);
      const membership = await this.getOwnerMembership(user.id, slug);
  
      const members = await this.prisma.storeMembership.findMany({
        where: { storeId: membership.storeId, role: "EMPLOYEE" },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
  
      return members.map(this.formatMember);
    }
  
    // ── POST /stores/:slug/members ────────────────────────────
  
    @Post()
    @UseGuards(AuthGuard)
    async addMember(
      @Param("slug") slug: string,
      @Req() req: AuthRequest,
      @Body() dto: AddMemberDto,
    ) {
      const user = await this.getLocalUser(req.authUserId!);
      const membership = await this.getOwnerMembership(user.id, slug);
  
      const target = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (!target) throw new NotFoundException("Usuario no encontrado en el sistema");
      if (target.id === user.id) throw new ConflictException("No podés agregarte a vos mismo como empleado");
  
      const existing = await this.prisma.storeMembership.findUnique({
        where: { userId_storeId: { userId: target.id, storeId: membership.storeId } },
      });
      if (existing) throw new ConflictException("Este usuario ya es miembro de la tienda");
  
      const newMember = await this.prisma.storeMembership.create({
        data: {
          userId: target.id,
          storeId: membership.storeId,
          role: "EMPLOYEE",
          canManageOrders: true,
          canManageProducts: true,
          canManageOperations: true,
          canManageLoyalty: false,
          canManageEmployees: false,
          canViewAnalytics: false,
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
  
      return this.formatMember(newMember);
    }
  
    // ── PATCH /stores/:slug/members/:memberId ─────────────────
  
    @Patch(":memberId")
    @UseGuards(AuthGuard)
    async updateMember(
      @Param("slug") slug: string,
      @Param("memberId") memberId: string,
      @Req() req: AuthRequest,
      @Body() dto: UpdateMemberDto,
    ) {
      const user = await this.getLocalUser(req.authUserId!);
      const membership = await this.getOwnerMembership(user.id, slug);
  
      const target = await this.prisma.storeMembership.findUnique({
        where: { id: memberId },
      });
      if (!target || target.storeId !== membership.storeId) throw new NotFoundException("Member not found");
      if (target.role !== "EMPLOYEE") throw new ForbiddenException("No podés modificar permisos de un owner");
  
      const updated = await this.prisma.storeMembership.update({
        where: { id: memberId },
        data: dto,
        include: { user: { select: { id: true, name: true, email: true } } },
      });
  
      return this.formatMember(updated);
    }
  
    // ── DELETE /stores/:slug/members/:memberId ────────────────
  
    @Delete(":memberId")
    @UseGuards(AuthGuard)
    async removeMember(
      @Param("slug") slug: string,
      @Param("memberId") memberId: string,
      @Req() req: AuthRequest,
    ) {
      const user = await this.getLocalUser(req.authUserId!);
      const membership = await this.getOwnerMembership(user.id, slug);
  
      const target = await this.prisma.storeMembership.findUnique({
        where: { id: memberId },
      });
      if (!target || target.storeId !== membership.storeId) throw new NotFoundException("Member not found");
      if (target.role !== "EMPLOYEE") throw new ForbiddenException("No podés eliminar a un owner");
  
      await this.prisma.storeMembership.delete({ where: { id: memberId } });
      return { removed: true };
    }
  }