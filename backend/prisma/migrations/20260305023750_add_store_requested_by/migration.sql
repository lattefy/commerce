-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "requestedByUserId" UUID;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
