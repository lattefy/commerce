import { IsString, Length, Matches } from "class-validator";

export class RequestStoreDto {
  @IsString()
  @Length(3, 80)
  name!: string;

  // slug used in URLs: lattefy.com/store/slug
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: "Slug must be lowercase alphanumeric with dashes only",
  })
  @Length(3, 60)
  slug!: string;
}