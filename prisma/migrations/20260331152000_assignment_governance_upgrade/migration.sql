-- Add NGO specialization and capacity fields
ALTER TABLE "NGO"
ADD COLUMN "supportedReportTypes" "ReportType"[] DEFAULT ARRAY[]::"ReportType"[],
ADD COLUMN "coverageAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "maxActiveCases" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN "priorityEscalationHours" INTEGER NOT NULL DEFAULT 24;

-- Add audit log table for assignment governance tracking
CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT,
  "category" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "severity" TEXT NOT NULL DEFAULT 'INFO',
  "message" TEXT NOT NULL,
  "rationale" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_category_idx" ON "AuditLog"("category");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
