/*
  Warnings:

  - Changed the type of `gameName` on the `Game` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "GameName" AS ENUM ('LUDO', 'CRICKET', 'MINES', 'CHESS', 'DICE');

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "gameName",
ADD COLUMN     "gameName" "GameName" NOT NULL;
