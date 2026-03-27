CREATE TABLE "CaseNote" (
  "id" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CaseNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CaseNote_caseId_idx" ON "CaseNote"("caseId");
CREATE INDEX "CaseNote_authorId_idx" ON "CaseNote"("authorId");
CREATE INDEX "CaseNote_createdAt_idx" ON "CaseNote"("createdAt");

ALTER TABLE "CaseNote"
ADD CONSTRAINT "CaseNote_caseId_fkey"
FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CaseNote"
ADD CONSTRAINT "CaseNote_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
