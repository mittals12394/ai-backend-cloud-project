-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "IssueSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "severity" "IssueSeverity" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "status" "IssueStatus" NOT NULL DEFAULT 'OPEN';
