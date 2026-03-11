-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "deliveryZone" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "schedule" JSONB,
ADD COLUMN     "website" TEXT;
