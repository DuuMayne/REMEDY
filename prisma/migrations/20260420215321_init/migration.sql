-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner'
);

-- CreateTable
CREATE TABLE "RemediationItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalKey" TEXT NOT NULL,
    "prismScenarioId" TEXT,
    "prismFindingId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "findingType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "sourceSystem" TEXT,
    "applicationName" TEXT,
    "entitlementName" TEXT,
    "userId" TEXT,
    "userEmail" TEXT,
    "userDisplayName" TEXT,
    "ownerId" TEXT,
    "escalationOwnerId" TEXT,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolutionType" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "resolvedAt" DATETIME,
    "verifiedAt" DATETIME,
    "closedAt" DATETIME,
    CONSTRAINT "RemediationItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RemediationItem_escalationOwnerId_fkey" FOREIGN KEY ("escalationOwnerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "remediationItemId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StatusHistory_remediationItemId_fkey" FOREIGN KEY ("remediationItemId") REFERENCES "RemediationItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StatusHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EvidenceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "remediationItemId" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "sourceSystem" TEXT,
    "fileName" TEXT,
    "fileUrl" TEXT,
    "description" TEXT NOT NULL,
    "periodCoveredStart" DATETIME,
    "periodCoveredEnd" DATETIME,
    "uploadedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvidenceRecord_remediationItemId_fkey" FOREIGN KEY ("remediationItemId") REFERENCES "RemediationItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvidenceRecord_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "remediationItemId" TEXT NOT NULL,
    "verifierId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerificationRecord_remediationItemId_fkey" FOREIGN KEY ("remediationItemId") REFERENCES "RemediationItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VerificationRecord_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssignmentHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "remediationItemId" TEXT NOT NULL,
    "previousOwnerId" TEXT,
    "newOwnerId" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssignmentHistory_remediationItemId_fkey" FOREIGN KEY ("remediationItemId") REFERENCES "RemediationItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AssignmentHistory_previousOwnerId_fkey" FOREIGN KEY ("previousOwnerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AssignmentHistory_newOwnerId_fkey" FOREIGN KEY ("newOwnerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AssignmentHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SlaPolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "findingType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "dueInDays" INTEGER NOT NULL,
    "escalationAfterDays" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RemediationItem_externalKey_key" ON "RemediationItem"("externalKey");

-- CreateIndex
CREATE UNIQUE INDEX "SlaPolicy_findingType_severity_key" ON "SlaPolicy"("findingType", "severity");
