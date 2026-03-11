import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnv } from "./env";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

import { HealthController } from "./health.controller";
import { MeController } from "./me.controller";
import { OnboardingController } from "./onboarding/onboarding.controller";
import { StoresController } from "./stores/stores.controller";

import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { StoresModule } from "./stores/stores.module";
import { AdminModule } from "./admin/admin.module";
import { OrdersModule } from "./orders/orders.module";
import { LoyaltyModule } from "./loyalty/loyalty.module";
import { PaymentModule } from "./payment/payment.module";
import { AddressesModule } from "./addresses/addresses.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv}),
    PrismaModule,
    AuthModule,
    StoresModule,
    AdminModule,
    OrdersModule,
    LoyaltyModule,
    PaymentModule,
    AddressesModule
  ],
  controllers: [
    AppController, 
    HealthController, 
    MeController, 
    OnboardingController,
    StoresController
  ],
  providers: [AppService],
})
export class AppModule {}