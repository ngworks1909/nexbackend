/*
  Warnings:

  - The values [CRICKET,CHESS,DICE] on the enum `GameName` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GameName_new" AS ENUM ('LUDO', 'MINES', 'MEMORY');
ALTER TABLE "Game" ALTER COLUMN "gameName" TYPE "GameName_new" USING ("gameName"::text::"GameName_new");
ALTER TYPE "GameName" RENAME TO "GameName_old";
ALTER TYPE "GameName_new" RENAME TO "GameName";
DROP TYPE "GameName_old";
COMMIT;
