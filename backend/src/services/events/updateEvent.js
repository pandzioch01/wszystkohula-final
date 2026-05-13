const defaultPrisma = require('../../config/prisma');

// Optional `prisma` mirrors the sibling services (getEventDetails, getEventsInRange):
// production callers omit it and get the real singleton; tests pass a mock.
async function updateEvent(id, data, actorMemberId, prisma = defaultPrisma) {
  // Build a partial update — only include keys that were explicitly provided
  // so PATCH semantics work (omitting a field leaves it untouched).
  const update = {};
  if (data.title !== undefined) update.title = data.title;
  if (data.description !== undefined) update.description = data.description;
  if (data.clientName !== undefined) update.clientName = data.clientName;
  if (data.firmsNames !== undefined) update.firmsNames = data.firmsNames;
  if (data.startDate !== undefined) update.startDate = data.startDate;
  if (data.endDate !== undefined) update.endDate = data.endDate;

  const event = await prisma.event.update({
    where: { id },
    data: update,
    select: {
      id: true,
      title: true,
      description: true,
      clientName: true,
      firmsNames: true,
      startDate: true,
      endDate: true,
    },
  });

  // Tool assignments — replace the set of unreturned assignments with what
  // the client sent. Returned (historical) assignments are left untouched so
  // we don't rewrite history.
  if (data.toolIds !== undefined) {
    await prisma.eventTool.deleteMany({
      where: { eventId: id, returnedAt: null },
    });
    if (data.toolIds.length > 0) {
      await prisma.eventTool.createMany({
        data: data.toolIds.map((toolId) => ({ eventId: id, toolId })),
      });
    }

    // TODO (post-auth): when the login/register system is in place, compare
    // the new toolIds against the previous assignments and notify the current
    // borrower (Tool.borrowedById) of any newly-added tool that their tool
    // is being assigned to event "${event.title}" by ${actorMemberId}.
  }

  // Best-effort audit log.
  if (actorMemberId !== undefined) {
    try {
      const fieldNames = Object.keys(update).join(', ');
      await prisma.eventChange.create({
        data: {
          eventId: event.id,
          eventTitleSnapshot: event.title,
          memberId: actorMemberId,
          changeType: 'UPDATED',
          description: `Updated event "${event.title}" (${fieldNames})`,
        },
      });
    } catch (err) {
      console.error('Failed to write UPDATED audit:', err);
    }
  }

  return event;
}

module.exports = { updateEvent };
