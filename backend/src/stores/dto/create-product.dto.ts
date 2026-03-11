import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsUUID,
    IsInt,
    IsEnum,
    Min,
    MaxLength,
    ValidateNested,
    ArrayMinSize,
    IsBoolean,
  } from "class-validator";
  import { Type } from "class-transformer";
  import { ProductStatus } from "@prisma/client";
  
  export class CreatePortionDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(80)
    name!: string;
  
    @IsInt()
    @Min(0)
    price!: number;
  
    @IsOptional()
    @IsInt()
    @Min(0)
    stock?: number;
  
    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
  
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
  }
  
  export class CreateExtraDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(80)
    name!: string;
  
    @IsInt()
    @Min(0)
    price!: number;
  
    @IsOptional()
    @IsInt()
    @Min(1)
    maxQty?: number;
  
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
  }
  
  export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    name!: string;
  
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
  
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @Type(() => CreatePortionDto)
    portions!: CreatePortionDto[];
  
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateExtraDto)
    extras?: CreateExtraDto[];
  }