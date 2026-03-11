import { IsString, IsOptional, IsInt, IsBoolean, Min, MaxLength } from "class-validator";

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}