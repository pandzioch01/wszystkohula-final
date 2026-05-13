const defaultPrisma = require('../../config/prisma');

// Optional `prisma` mirrors the sibling services (getEventDetails, getEventsInRange):
// production callers omit it and get the real singleton; tests pass a mock.
async function createEvent(data, actorMemberId, prisma = defaultPrisma) {
  const event = await prisma.event.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      clientName: data.clientName ?? null,
      firmsNames: data.firmsNames ?? [],
      startDate: data.startDate,
      endDate: data.endDate,
      // Optional bulk tool assignment in the same INSERT statement.
      usedTools: data.toolIds && data.toolIds.length > 0
        ? { create: data.toolIds.map((toolId) => ({ toolId })) }
        : undefined,
    },
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

  // TODO (post-auth): when the login/register system is in place, walk through
  // `data.toolIds` and for each tool whose `borrowedById` is set, send a
  // notification to that member that the tool they're currently holding has
  // been assigned to event `event.title` (dates: startDate → endDate) by
  // `actorMemberId`. The borrower can then either deliver it themselves or
  // hand it back to the org.

  // Best-effort audit log.
  if (actorMemberId !== undefined) {
    try {
      await prisma.eventChange.create({
        data: {
          eventId: event.id,
          eventTitleSnapshot: event.title,
          memberId: actorMemberId,
          changeType: 'CREATED',
          description: `Created event "${event.title}"`,
        },
      });
    } catch (err) {
      console.error('Failed to write CREATED audit:', err);
    }
  }

  return event;
}

module.exports = { createEvent };
