const prisma = require('../../config/prisma');

const ACTION_LABELS = {
  CREATED: 'created event',
  UPDATED: 'updated event',
  DELETED: 'deleted event',
  MEMBER_ADDED: 'added a member to event',
  MEMBER_REMOVED: 'removed a member from event',
  TOOL_ASSIGNED: 'assigned a tool to event',
  TOOL_RETURNED: 'returned a tool from event',
};

async function getMemberChanges(memberId) {
  const changes = await prisma.eventChange.findMany({
    where: { memberId },
    orderBy: { timestamp: 'desc' },
    select: {
      id: true,
      changeType: true,
      timestamp: true,
      description: true,
      event: { select: { id: true, title: true } },
      member: { select: { id: true, name: true } },
    },
  });

  return changes.map((c) => {
    const personName = c.member.name ?? 'Unknown member';
    const action = ACTION_LABELS[c.changeType] ?? 'changed event';
    const message = `${personName} ${action} "${c.event.title}"`;

    return {
      id: c.id,
      message,
      changeType: c.changeType,
      eventId: c.event.id,
      eventTitle: c.event.title,
      memberId: c.member.id,
      memberName: c.member.name,
      description: c.description,
      timestamp: c.timestamp,
    };
  });
}

module.exports = { getMemberChanges };
