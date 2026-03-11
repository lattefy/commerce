import { Module } from "@nestjs/common";
import { AddressesController } from "./addresses.controller";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  controllers: [AddressesController],
  providers: [PrismaService],
})
export class AddressesModule {}