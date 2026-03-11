import { Global, Module } from "@nestjs/common";
import { JwksService } from "./jwks.service";
import { AuthGuard } from "./auth.guard";

@Global()
@Module({
  providers: [JwksService, AuthGuard],
  exports: [JwksService, AuthGuard],
})
export class AuthModule {}