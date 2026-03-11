-- AlterEnum
ALTER TYPE "RewardType" ADD VALUE 'FREE_PRODUCT';

-- AlterTable
ALTER TABLE "Reward" ADD COLUMN     "productId" UUID,
ALTER COLUMN "discountValue" SET DEFAULT 0;

-- CreateIndex
CREATE INDEX "Reward_productId_idx" ON "Reward"("productId");

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
