/*
  Warnings:

  - You are about to drop the column `role` on the `event_participants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "event_participants" DROP COLUMN "role";

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "clientName" TEXT,
ADD COLUMN     "firmsNames" TEXT[];

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "city" TEXT,
ADD COLUMN     "ownedTools" TEXT[],
ADD COLUMN     "specializations" TEXT[];

-- AlterTable
ALTER TABLE "tools" ADD COLUMN     "borrowedById" INTEGER,
ADD COLUMN     "borrowedSince" TIMESTAMP(3),
ADD COLUMN     "imageUrl" TEXT;

-- CreateIndex
CREATE INDEX "tools_borrowedById_idx" ON "tools"("borrowedById");

-- AddForeignKey
ALTER TABLE "tools" ADD CONSTRAINT "tools_borrowedById_fkey" FOREIGN KEY ("borrowedById") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
