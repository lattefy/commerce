import { IsString, IsNotEmpty, IsOptional, IsUUID, IsInt, Min, MaxLength } from "class-validator";

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}