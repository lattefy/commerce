import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthRequest } from "../auth/auth.types";

@Controller("addresses")
export class AddressesController {
  constructor(private readonly prisma: PrismaService) {}

  private async getLocalUser(authUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { authUserId } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  @Get()
  @UseGuards(AuthGuard)
  async getAddresses(@Req() req: AuthRequest) {
    const user = await this.getLocalUser(req.authUserId!);
    return this.prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });
  }

  @Post()
  @UseGuards(AuthGuard)
  async createAddress(
    @Req() req: AuthRequest,
    @Body() body: { label: string; street: string; details?: string },
  ) {
    const user = await this.getLocalUser(req.authUserId!);
    return this.prisma.address.create({
      data: {
        userId: user.id,
        label: body.label,
        street: body.street,
        details: body.details,
      },
    });
  }

  @Patch(":id")
  @UseGuards(AuthGuard)
  async updateAddress(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: { label?: string; street?: string; details?: string },
  ) {
    const user = await this.getLocalUser(req.authUserId!);
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address || address.userId !== user.id) throw new NotFoundException("Address not found");
    return this.prisma.address.update({ where: { id }, data: body });
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  async deleteAddress(
    @Req() req: AuthRequest,
    @Param("id") id: string,
  ) {
    const user = await this.getLocalUser(req.authUserId!);
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address || address.userId !== user.id) throw new NotFoundException("Address not found");
    await this.prisma.address.delete({ where: { id } });
    return { deleted: true };
  }
}