-- AlterTable
ALTER TABLE "tokens" ADD COLUMN     "email" TEXT;

-- CreateIndex
CREATE INDEX "tokens_email_idx" ON "tokens"("email");
