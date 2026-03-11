-- CreateEnum
CREATE TYPE "GlobalRole" AS ENUM ('PLATFORM_ADMIN', 'NORMAL');

-- CreateEnum
CREATE TYPE "StoreRole" AS ENUM ('OWNER', 'EMPLOYEE');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "authUserId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT,
    "globalRole" "GlobalRole" NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branding" JSONB,
    "country" TEXT NOT NULL DEFAULT 'UY',
    "currency" TEXT NOT NULL DEFAULT 'UYU',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreMembership" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "storeId" UUID NOT NULL,
    "role" "StoreRole" NOT NULL,
    "canManageProducts" BOOLEAN NOT NULL DEFAULT false,
    "canManageOrders" BOOLEAN NOT NULL DEFAULT false,
    "canManageLoyalty" BOOLEAN NOT NULL DEFAULT false,
    "canManageEmployees" BOOLEAN NOT NULL DEFAULT false,
    "canViewAnalytics" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_authUserId_key" ON "User"("authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Store_slug_key" ON "Store"("slug");

-- CreateIndex
CREATE INDEX "StoreMembership_storeId_idx" ON "StoreMembership"("storeId");

-- CreateIndex
CREATE INDEX "StoreMembership_userId_idx" ON "StoreMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreMembership_userId_storeId_key" ON "StoreMembership"("userId", "storeId");

-- AddForeignKey
ALTER TABLE "StoreMembership" ADD CONSTRAINT "StoreMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreMembership" ADD CONSTRAINT "StoreMembership_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
