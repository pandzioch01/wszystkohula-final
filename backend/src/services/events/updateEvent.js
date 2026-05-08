const prisma = require('../../config/prisma');

async function updateEvent(id, data, actorMemberId) {
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

  // Best-effort audit log. If it fails (e.g. invalid actorMemberId), don't
  // roll back the update — the audit is supplementary, not critical.
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
