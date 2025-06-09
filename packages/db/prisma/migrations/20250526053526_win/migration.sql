/*
  Warnings:

  - Added the required column `winAmount` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "winAmount" DOUBLE PRECISION NOT NULL;
