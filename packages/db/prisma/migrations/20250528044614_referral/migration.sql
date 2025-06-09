/*
  Warnings:

  - You are about to drop the column `referredBy` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "referredBy";

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referredBy" TEXT NOT NULL,
    "referredTo" TEXT NOT NULL,
    "referredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bonus" DOUBLE PRECISION NOT NULL DEFAULT 100,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredTo_key" ON "Referral"("referredTo");

-- CreateIndex
CREATE INDEX "Referral_referredBy_idx" ON "Referral"("referredBy");

-- CreateIndex
CREATE INDEX "Referral_referredTo_idx" ON "Referral"("referredTo");

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredBy_fkey" FOREIGN KEY ("referredBy") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredTo_fkey" FOREIGN KEY ("referredTo") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
