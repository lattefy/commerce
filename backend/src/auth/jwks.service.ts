import { Injectable } from "@nestjs/common";
import { createRemoteJWKSet } from "jose";

@Injectable()
export class JwksService {
  private jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor() {
    const jwksUrl = process.env.SUPABASE_JWKS_URL;

    if (!jwksUrl) {
      throw new Error("SUPABASE_JWKS_URL is missing. Check your .env file.");
    }

    this.jwks = createRemoteJWKSet(new URL(jwksUrl));
  }

  getJwks() {
    return this.jwks;
  }
}