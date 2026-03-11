import { IsInt, IsOptional, Min } from "class-validator";

export class UpsertLoyaltySettingsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  pesosPerPoint?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxPointsPerOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  pointsExpiryDays?: number;
}