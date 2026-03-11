/*
  Warnings:

  - Made the column `stock` on table `ProductPortion` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ProductPortion" ALTER COLUMN "stock" SET NOT NULL,
ALTER COLUMN "stock" SET DEFAULT -1;
