import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsUUID,
  Min,
  MaxLength,
} from "class-validator";
import { RewardType } from "@prisma/client";

export class CreateRewardDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsEnum(RewardType)
  type!: RewardType;

  @IsInt()
  @Min(1)
  pointsCost!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}