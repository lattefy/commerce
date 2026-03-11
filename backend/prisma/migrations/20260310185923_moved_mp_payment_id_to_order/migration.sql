/*
  Warnings:

  - You are about to drop the column `mpPaymentId` on the `OrderItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "mpPaymentId" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "mpPaymentId";
