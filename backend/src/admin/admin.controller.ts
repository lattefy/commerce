import { Controller, Patch, Get, Post, Param, UseGuards, NotFoundException, ConflictException } from "@nestjs/common";
import { AdminGuard } from "./admin.guard";
import { PrismaService } from "../prisma/prisma.service";

@Controller("admin")
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("stores/pending")
  @UseGuards(AdminGuard)
  async getPendingStores() {
    return this.prisma.store.findMany({
      where: { status: "PENDING" },
      include: {
        requestedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  @Post("stores/:id/approve")
  @UseGuards(AdminGuard)
  async approveStore(@Param("id") id: string) {
    const store = await this.prisma.store.findUnique({ where: { id } });

    if (!store) throw new NotFoundException("Store not found");
    if (store.status === "APPROVED") throw new ConflictException("Store is already approved");

    const updated = await this.prisma.store.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    return { approved: true, store: updated };
  }

  @Post("stores/:id/reject")
  @UseGuards(AdminGuard)
  async rejectStore(@Param("id") id: string) {
    const store = await this.prisma.store.findUnique({ where: { id } });

    if (!store) throw new NotFoundException("Store not found");

    const updated = await this.prisma.store.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    return { rejected: true, store: updated };
  }
}