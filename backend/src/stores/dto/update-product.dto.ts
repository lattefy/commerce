import {
    IsString,
    IsOptional,
    IsUUID,
    IsInt,
    IsEnum,
    Min,
    MaxLength,
  } from "class-validator";
  import { ProductStatus } from "@prisma/client";
  
  export class UpdateProductDto {
    @IsOptional()
    @IsString()
    @MaxLength(120)
    name?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;
  
    @IsOptional()
    @IsUUID()
    categoryId?: string;
  
    @IsOptional()
    @IsEnum(ProductStatus)
    status?: ProductStatus;
  
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
  }