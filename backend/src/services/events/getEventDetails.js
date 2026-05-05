const prisma = require('../../config/prisma');

async function getEventDetails(eventId) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      description: true,
      startDate: true,
      endDate: true,
      participants: {
        select: {
          member: { select: { id: true, name: true } },
        },
      },
      usedTools: {
        select: {
          assignedAt: true,
          returnedAt: true,
          tool: { select: { id: true, name: true, status: true } },
        },
      },
    },
  });

  if (!event) return null;

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    participants: event.participants.map((p) => ({
      id: p.member.id,
      name: p.member.name,
    })),
    tools: event.usedTools.map((t) => ({
      id: t.tool.id,
      name: t.tool.name,
      status: t.tool.status,
      assignedAt: t.assignedAt,
      returnedAt: t.returnedAt,
    })),
  };
}

module.exports = { getEventDetails };
