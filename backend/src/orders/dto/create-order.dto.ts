import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  ArrayMinSize,
} from "class-validator";
import { Type } from "class-transformer";
import { OrderType } from "@prisma/client";

export class CreateOrderItemExtraDto {
  @IsUUID()
  extraId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderItemDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  portionId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemExtraDto)
  extras?: CreateOrderItemExtraDto[];
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsOptional()
  @IsEnum(OrderType)
  orderType?: OrderType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  notes?: string;

  @IsOptional()
  @IsUUID()
  addressId?: string;
}