/*
  Warnings:

  - The `paymentStatus` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `referStatus` column on the `Referral` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('Pending', 'Success', 'Failed');

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "paymentStatus",
ADD COLUMN     "paymentStatus" "TransactionStatus" NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE "Referral" DROP COLUMN "referStatus",
ADD COLUMN     "referStatus" "TransactionStatus" NOT NULL DEFAULT 'Pending';

-- DropEnum
DROP TYPE "StampStatus";
