-- DropForeignKey
ALTER TABLE "event_changes" DROP CONSTRAINT "event_changes_eventId_fkey";

-- AlterTable
ALTER TABLE "event_changes" ALTER COLUMN "eventId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "event_changes" ADD CONSTRAINT "event_changes_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
