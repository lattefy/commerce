-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "status" "StoreStatus" NOT NULL DEFAULT 'PENDING';
