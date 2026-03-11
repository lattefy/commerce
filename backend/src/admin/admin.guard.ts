import { CanActivate, ExecutionContext, Injectable, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthRequest } from "../auth/auth.types";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly authGuard: AuthGuard,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First run the base JWT check
    await this.authGuard.canActivate(context);

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const authUserId = request.authUserId;

    if (!authUserId) {
      throw new UnauthorizedException("Missing authUserId");
    }

    const user = await this.prisma.user.findUnique({
      where: { authUserId },
    });

    if (!user) {
      throw new UnauthorizedException("User profile not found");
    }

    if (user.globalRole !== "PLATFORM_ADMIN") {
      throw new ForbiddenException("Platform admin access required");
    }

    return true;
  }
}