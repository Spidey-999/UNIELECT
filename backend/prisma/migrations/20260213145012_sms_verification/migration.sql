/*
  Warnings:

  - A unique constraint covering the columns `[electionId,verifiedVoterId]` on the table `ballots` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ballots" ADD COLUMN     "verifiedVoterId" TEXT;

-- AlterTable
ALTER TABLE "tokens" ADD COLUMN     "verifiedVoterId" TEXT;

-- CreateTable
CREATE TABLE "verified_voters" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verified_voters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_verifications" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "verified_voters_electionId_idx" ON "verified_voters"("electionId");

-- CreateIndex
CREATE UNIQUE INDEX "verified_voters_electionId_externalId_key" ON "verified_voters"("electionId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "verified_voters_electionId_phoneNumber_key" ON "verified_voters"("electionId", "phoneNumber");

-- CreateIndex
CREATE INDEX "sms_verifications_electionId_externalId_idx" ON "sms_verifications"("electionId", "externalId");

-- CreateIndex
CREATE INDEX "sms_verifications_electionId_phoneNumber_idx" ON "sms_verifications"("electionId", "phoneNumber");

-- CreateIndex
CREATE INDEX "sms_verifications_expiresAt_idx" ON "sms_verifications"("expiresAt");

-- CreateIndex
CREATE INDEX "ballots_verifiedVoterId_idx" ON "ballots"("verifiedVoterId");

-- CreateIndex
CREATE UNIQUE INDEX "ballots_electionId_verifiedVoterId_key" ON "ballots"("electionId", "verifiedVoterId");

-- CreateIndex
CREATE INDEX "tokens_verifiedVoterId_idx" ON "tokens"("verifiedVoterId");

-- AddForeignKey
ALTER TABLE "verified_voters" ADD CONSTRAINT "verified_voters_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_verifications" ADD CONSTRAINT "sms_verifications_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_verifiedVoterId_fkey" FOREIGN KEY ("verifiedVoterId") REFERENCES "verified_voters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ballots" ADD CONSTRAINT "ballots_verifiedVoterId_fkey" FOREIGN KEY ("verifiedVoterId") REFERENCES "verified_voters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
