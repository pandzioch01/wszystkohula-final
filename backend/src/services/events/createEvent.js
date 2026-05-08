const prisma = require('../../config/prisma');

async function createEvent(data, actorMemberId) {
  const event = await prisma.event.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      clientName: data.clientName ?? null,
      firmsNames: data.firmsNames ?? [],
      startDate: data.startDate,
      endDate: data.endDate,
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

  // Best-effort audit log. If it fails (e.g. invalid actorMemberId), don't
  // roll back the event creation — the audit is supplementary, not critical.
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
