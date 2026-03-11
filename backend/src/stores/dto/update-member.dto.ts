import { IsBoolean, IsOptional } from "class-validator";

export class UpdateMemberDto {
  @IsOptional()
  @IsBoolean()
  canManageProducts?: boolean;

  @IsOptional()
  @IsBoolean()
  canManageOrders?: boolean;

  @IsOptional()
  @IsBoolean()
  canManageLoyalty?: boolean;

  @IsOptional()
  @IsBoolean()
  canManageEmployees?: boolean;

  @IsOptional()
  @IsBoolean()
  canViewAnalytics?: boolean;

  @IsOptional()
  @IsBoolean()
  canManageOperations?: boolean;
}