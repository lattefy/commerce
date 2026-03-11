import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  health() {
    return { ok: true };
  }

  @Get("db")
  async db() {
    // Simple DB ping. If this succeeds, runtime DB connectivity is working.
    await this.prisma.$queryRaw`SELECT 1`;
    return { ok: true, db: "connected" };
  }
}