-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastMessagePreview" TEXT,
ADD COLUMN     "unreadCount" INTEGER NOT NULL DEFAULT 0;
