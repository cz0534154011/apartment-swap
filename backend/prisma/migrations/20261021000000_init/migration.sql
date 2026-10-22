-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ApartmentStatus" AS ENUM ('ACTIVE', 'HIDDEN');

-- CreateEnum
CREATE TYPE "SwapStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'AUTO_REJECTED', 'WITHDRAWN', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "fullName" VARCHAR(60) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "phone" VARCHAR(16),
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "termsAcceptedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(40) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Apartment" (
    "id" SERIAL NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "cityId" INTEGER NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "neighborhood" VARCHAR(60) NOT NULL,
    "rooms" DECIMAL(3,1) NOT NULL,
    "beds" INTEGER NOT NULL,
    "floor" INTEGER NOT NULL,
    "hasElevator" BOOLEAN NOT NULL DEFAULT false,
    "hasPlata" BOOLEAN NOT NULL DEFAULT false,
    "hasUrn" BOOLEAN NOT NULL DEFAULT false,
    "hasShabbatClock" BOOLEAN NOT NULL DEFAULT false,
    "hasEruv" BOOLEAN NOT NULL DEFAULT false,
    "hasGenerator" BOOLEAN NOT NULL DEFAULT false,
    "description" VARCHAR(2000) NOT NULL,
    "status" "ApartmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockReason" VARCHAR(300),
    "blockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Apartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedDate" (
    "id" SERIAL NOT NULL,
    "apartmentId" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "note" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SwapOffer" (
    "id" SERIAL NOT NULL,
    "senderApartmentId" INTEGER NOT NULL,
    "receiverApartmentId" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "message" VARCHAR(500),
    "status" "SwapStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "cancelRequestedById" INTEGER,
    "cancelRequestReason" VARCHAR(300),
    "cancelRequestedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SwapOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "City_name_key" ON "City"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Apartment_ownerId_key" ON "Apartment"("ownerId");

-- CreateIndex
CREATE INDEX "Apartment_cityId_idx" ON "Apartment"("cityId");

-- CreateIndex
CREATE INDEX "Apartment_status_isBlocked_idx" ON "Apartment"("status", "isBlocked");

-- CreateIndex
CREATE INDEX "Apartment_beds_idx" ON "Apartment"("beds");

-- CreateIndex
CREATE INDEX "BlockedDate_apartmentId_startDate_endDate_idx" ON "BlockedDate"("apartmentId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "SwapOffer_receiverApartmentId_status_startDate_endDate_idx" ON "SwapOffer"("receiverApartmentId", "status", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "SwapOffer_senderApartmentId_status_startDate_endDate_idx" ON "SwapOffer"("senderApartmentId", "status", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "Apartment" ADD CONSTRAINT "Apartment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Apartment" ADD CONSTRAINT "Apartment_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedDate" ADD CONSTRAINT "BlockedDate_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwapOffer" ADD CONSTRAINT "SwapOffer_senderApartmentId_fkey" FOREIGN KEY ("senderApartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwapOffer" ADD CONSTRAINT "SwapOffer_receiverApartmentId_fkey" FOREIGN KEY ("receiverApartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwapOffer" ADD CONSTRAINT "SwapOffer_cancelRequestedById_fkey" FOREIGN KEY ("cancelRequestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Integrity checks (added manually; Prisma does not model CHECK constraints)
ALTER TABLE "Apartment" ADD CONSTRAINT "Apartment_rooms_check" CHECK ("rooms" >= 1 AND "rooms" <= 20 AND ("rooms" * 2) = TRUNC("rooms" * 2));
ALTER TABLE "Apartment" ADD CONSTRAINT "Apartment_beds_check" CHECK ("beds" >= 1 AND "beds" <= 30);
ALTER TABLE "Apartment" ADD CONSTRAINT "Apartment_floor_check" CHECK ("floor" >= -3 AND "floor" <= 60);
ALTER TABLE "Apartment" ADD CONSTRAINT "Apartment_block_reason_check" CHECK ("isBlocked" = false OR "blockReason" IS NOT NULL);
ALTER TABLE "BlockedDate" ADD CONSTRAINT "BlockedDate_dates_check" CHECK ("endDate" >= "startDate");
ALTER TABLE "SwapOffer" ADD CONSTRAINT "SwapOffer_dates_check" CHECK ("endDate" >= "startDate");
ALTER TABLE "SwapOffer" ADD CONSTRAINT "SwapOffer_different_apartments_check" CHECK ("senderApartmentId" <> "receiverApartmentId");
