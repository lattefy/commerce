-- CreateTable
CREATE TABLE "StorePaymentSettings" (
    "id" UUID NOT NULL,
    "storeId" UUID NOT NULL,
    "mpAccessToken" TEXT NOT NULL,
    "mpRefreshToken" TEXT,
    "mpUserId" TEXT,
    "mpPublicKey" TEXT,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorePaymentSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StorePaymentSettings_storeId_key" ON "StorePaymentSettings"("storeId");

-- AddForeignKey
ALTER TABLE "StorePaymentSettings" ADD CONSTRAINT "StorePaymentSettings_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
