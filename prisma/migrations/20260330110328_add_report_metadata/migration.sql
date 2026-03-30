-- CreateEnum
CREATE TYPE "SeverityLevel" AS ENUM ('MILD', 'MODERATE', 'URGENT');

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "incidentDate" TIMESTAMP(3),
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "severity" "SeverityLevel",
ADD COLUMN     "voiceNoteUrl" TEXT;
