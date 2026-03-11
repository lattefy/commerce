import { Body, Controller, Post, UseGuards, Req, ConflictException } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthRequest } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProfileDto } from "./dto/create-profile.dto";

@Controller("onboarding")
export class OnboardingController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(AuthGuard)
  @Post("profile")
  async createProfile(@Req() req: AuthRequest, @Body() body: CreateProfileDto) {
    const authUserId = req.authUserId;
    if (!authUserId) {
      // should not happen because guard sets it
      throw new ConflictException("Missing authUserId");
    }

    const existing = await this.prisma.user.findUnique({
      where: { authUserId },
      include: { memberships: true },
    });

    if (existing) {
      return {
        created: false,
        user: existing,
      };
    }

    const created = await this.prisma.user.create({
      data: {
        authUserId,
        email: body.email.toLowerCase(),
        name: body.name,
        phone: body.phone,
      },
      include: { memberships: true },
    });

    return {
      created: true,
      user: created,
    };
  }
}