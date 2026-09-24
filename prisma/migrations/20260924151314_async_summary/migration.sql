/*
  Warnings:

  - A unique constraint covering the columns `[issueId]` on the table `Summary` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `issueId` to the `Summary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Summary` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SummaryStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Summary" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "issueId" INTEGER NOT NULL,
ADD COLUMN     "requestedBy" INTEGER,
ADD COLUMN     "status" "SummaryStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "content" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Summary_issueId_key" ON "Summary"("issueId");

-- AddForeignKey
ALTER TABLE "Summary" ADD CONSTRAINT "Summary_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
