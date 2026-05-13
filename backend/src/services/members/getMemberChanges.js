const defaultPrisma = require('../../config/prisma');

const ACTION_LABELS = {
  CREATED: 'created event',
  UPDATED: 'updated event',
  DELETED: 'deleted event',
  MEMBER_ADDED: 'added a member to event',
  MEMBER_REMOVED: 'removed a member from event',
  TOOL_ASSIGNED: 'assigned a tool to event',
  TOOL_RETURNED: 'returned a tool from event',
};

// Optional `prisma` mirrors the sibling services:
// production callers omit it and get the real singleton; tests pass a mock.
async function getMemberChanges(memberId, prisma = defaultPrisma) {
  const changes = await prisma.eventChange.findMany({
    where: { memberId },
    orderBy: { timestamp: 'desc' },
    select: {
      id: true,
      changeType: true,
      timestamp: true,
      description: true,
      eventTitleSnapshot: true,
      event: { select: { id: true, title: true } },
      member: { select: { id: true, name: true } },
    },
  });

  return changes.map((c) => {
    const personName = c.member.name ?? 'Unknown member';
    const action = ACTION_LABELS[c.changeType] ?? 'changed event';
    // Prefer the live event title; fall back to the snapshot taken at write time
    // (used after the event is deleted, since SetNull nulls c.event but the
    // snapshot column persists).
    const eventTitle = c.event?.title ?? c.eventTitleSnapshot ?? '(deleted event)';
    const message = `${personName} ${action} "${eventTitle}"`;

    return {
      id: c.id,
      message,
      changeType: c.changeType,
      eventId: c.event?.id ?? null,
      eventTitle,
      memberId: c.member.id,
      memberName: c.member.name,
      description: c.description,
      timestamp: c.timestamp,
    };
  });
}

module.exports = { getMemberChanges };
