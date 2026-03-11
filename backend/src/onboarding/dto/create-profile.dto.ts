import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateProfileDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}