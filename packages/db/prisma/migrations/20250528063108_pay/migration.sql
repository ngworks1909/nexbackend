/*
  Warnings:

  - You are about to drop the column `otpExpire` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "otpExpire",
ADD COLUMN     "otpExpiry" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
