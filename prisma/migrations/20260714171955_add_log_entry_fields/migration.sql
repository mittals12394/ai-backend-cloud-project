/*
  Warnings:

  - You are about to drop the column `message` on the `LogEntry` table. All the data in the column will be lost.
  - Added the required column `rawText` to the `LogEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `LogEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LogEntry" DROP COLUMN "message",
ADD COLUMN     "rawText" TEXT NOT NULL,
ADD COLUMN     "source" TEXT NOT NULL;
