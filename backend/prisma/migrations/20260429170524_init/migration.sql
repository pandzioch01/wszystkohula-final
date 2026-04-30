-- CreateEnum
CREATE TYPE "ToolStatus" AS ENUM ('AVAILABLE', 'IN_STORAGE', 'AT_EVENT', 'BORROWED', 'MAINTENANCE', 'LOST');

-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'MEMBER_ADDED', 'MEMBER_REMOVED', 'TOOL_ASSIGNED', 'TOOL_RETURNED');

-- CreateTable
CREATE TABLE "members" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tools" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ToolStatus" NOT NULL DEFAULT 'AVAILABLE',
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_participants" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "memberId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'participant',

    CONSTRAINT "event_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_tools" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "toolId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),

    CONSTRAINT "event_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_changes" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "memberId" INTEGER NOT NULL,
    "changeType" "ChangeType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,

    CONSTRAINT "event_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");

-- CreateIndex
CREATE INDEX "members_email_idx" ON "members"("email");

-- CreateIndex
CREATE INDEX "events_startDate_endDate_idx" ON "events"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "events_startDate_idx" ON "events"("startDate");

-- CreateIndex
CREATE INDEX "tools_status_idx" ON "tools"("status");

-- CreateIndex
CREATE INDEX "event_participants_eventId_idx" ON "event_participants"("eventId");

-- CreateIndex
CREATE INDEX "event_participants_memberId_idx" ON "event_participants"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "event_participants_eventId_memberId_key" ON "event_participants"("eventId", "memberId");

-- CreateIndex
CREATE INDEX "event_tools_eventId_idx" ON "event_tools"("eventId");

-- CreateIndex
CREATE INDEX "event_tools_toolId_idx" ON "event_tools"("toolId");

-- CreateIndex
CREATE UNIQUE INDEX "event_tools_eventId_toolId_key" ON "event_tools"("eventId", "toolId");

-- CreateIndex
CREATE INDEX "event_changes_eventId_timestamp_idx" ON "event_changes"("eventId", "timestamp");

-- CreateIndex
CREATE INDEX "event_changes_memberId_idx" ON "event_changes"("memberId");

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_tools" ADD CONSTRAINT "event_tools_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_tools" ADD CONSTRAINT "event_tools_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_changes" ADD CONSTRAINT "event_changes_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_changes" ADD CONSTRAINT "event_changes_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
