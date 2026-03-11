import { IsBoolean, IsOptional, IsObject, IsString, MaxLength, IsJSON } from "class-validator";

export class UpdateStoreDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  deliveryZone?: string;

  @IsOptional()
  schedule?: any;

  @IsOptional()
  @IsObject()
  branding?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  allowsPickup?: boolean;

  @IsOptional()
  @IsBoolean()
  allowsDelivery?: boolean;

  @IsOptional()
  @IsString()
  pickupTime?: string;

  @IsOptional()
  @IsString()
  deliveryTime?: string;
}