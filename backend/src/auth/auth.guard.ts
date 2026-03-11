import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { jwtVerify } from "jose";
import { JwksService } from "./jwks.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwksService: JwksService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader: string | undefined = request.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing Bearer token");
    }

    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
      throw new UnauthorizedException("Missing token");
    }

    try {
      const jwks = this.jwksService.getJwks();

      const { payload } = await jwtVerify(token, jwks, {
        // Supabase uses HS? No — Supabase access tokens are signed with asymmetric keys and published via JWKS.
        // We do basic issuer checking if SUPABASE_URL exists.
        issuer: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL}/auth/v1` : undefined,
      });

      // Supabase user id is typically in `sub`
      const authUserId = typeof payload.sub === "string" ? payload.sub : null;
      if (!authUserId) {
        throw new UnauthorizedException("Token missing subject");
      }

      request.authUserId = authUserId;
      return true;
    } catch (err) {
      throw new UnauthorizedException("Invalid token");
    }
  }
}