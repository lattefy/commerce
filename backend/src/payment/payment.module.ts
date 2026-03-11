import { Module } from "@nestjs/common";
import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";
import { JwksService } from "../auth/jwks.service";

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, JwksService],
})
export class PaymentModule {}