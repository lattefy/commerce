-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "allowsDelivery" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allowsPickup" BOOLEAN NOT NULL DEFAULT true;
