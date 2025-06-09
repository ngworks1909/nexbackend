/*
  Warnings:

  - The `paymentStatus` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Referral` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `referId` on the `Referral` table. All the data in the column will be lost.
  - You are about to drop the column `referStatus` on the `Referral` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[referredBy,referredTo]` on the table `Referral` will be added. If there are existing duplicate values, this will fail.
  - The required column `referralId` was added to the `Referral` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('Pending', 'Success', 'Failed');

-- DropIndex
DROP INDEX "Game_gameId_gameName_idx";

-- DropIndex
DROP INDEX "Payment_paymentId_userId_idx";

-- DropIndex
DROP INDEX "Referral_referredBy_idx";

-- DropIndex
DROP INDEX "Referral_referredTo_idx";

-- DropIndex
DROP INDEX "Room_roomId_idx";

-- DropIndex
DROP INDEX "User_userId_mobile_idx";

-- DropIndex
DROP INDEX "Wallet_walletId_userId_idx";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "paymentStatus",
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_pkey",
DROP COLUMN "referId",
DROP COLUMN "referStatus",
ADD COLUMN     "referralId" TEXT NOT NULL,
ADD CONSTRAINT "Referral_pkey" PRIMARY KEY ("referralId");

-- DropEnum
DROP TYPE "TransactionStatus";

-- CreateIndex
CREATE INDEX "Game_gameName_idx" ON "Game"("gameName");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Referral_referredBy_referredTo_idx" ON "Referral"("referredBy", "referredTo");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredBy_referredTo_key" ON "Referral"("referredBy", "referredTo");

-- CreateIndex
CREATE INDEX "User_mobile_idx" ON "User"("mobile");
