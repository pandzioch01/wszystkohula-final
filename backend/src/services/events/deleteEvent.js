const prisma = require('../../config/prisma');

async function deleteEvent(id, actorMemberId) {
  // Capture the title before deletion so the audit description is meaningful.
  // Prisma's delete returns the row that was deleted, which is enough here.
  // EventParticipant, EventTool, and EventChange.event use cascade/SetNull,
  // so existing audits stay (with eventId nulled) and a DELETED audit can
  // be written below.
  const deleted = await prisma.event.delete({
    where: { id },
    select: { id: true, title: true },
  });

  if (actorMemberId !== undefined) {
    try {
      await prisma.eventChange.create({
        data: {
          eventId: null, // event is gone; snapshot preserves the title
          eventTitleSnapshot: deleted.title,
          memberId: actorMemberId,
          changeType: 'DELETED',
          description: `Deleted event "${deleted.title}"`,
        },
      });
    } catch (err) {
      console.error('Failed to write DELETED audit:', err);
    }
  }
}

module.exports = { deleteEvent };
