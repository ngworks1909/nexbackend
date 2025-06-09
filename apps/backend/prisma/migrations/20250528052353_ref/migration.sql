/*
  Warnings:

  - The `paymentStatus` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Referral` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Referral` table. All the data in the column will be lost.
  - The required column `referId` was added to the `Referral` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "StampStatus" AS ENUM ('Pending', 'Success', 'Failed');

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "paymentStatus",
ADD COLUMN     "paymentStatus" "StampStatus" NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_pkey",
DROP COLUMN "id",
ADD COLUMN     "referId" TEXT NOT NULL,
ADD COLUMN     "referStatus" "StampStatus" NOT NULL DEFAULT 'Pending',
ADD CONSTRAINT "Referral_pkey" PRIMARY KEY ("referId");

-- DropEnum
DROP TYPE "PaymentStatus";
