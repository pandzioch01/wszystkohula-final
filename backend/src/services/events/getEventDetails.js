const defaultPrisma = require('../../config/prisma');
const { deriveToolStatus } = require('../tools/deriveToolStatus');

// The optional `prisma` parameter exists for tests: production callers omit it
// and the default (the real singleton) is used; tests pass a fake object that
// satisfies the same shape (prisma.event.findUnique). This sidesteps Vitest's
// CJS/ESM mocking headaches and Prisma's Proxy delegate model — the test is
// literally giving the function the object it will use.
async function getEventDetails(eventId, prisma = defaultPrisma) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      description: true,
      clientName: true,
      firmsNames: true,
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
          tool: {
            select: {
              id: true,
              name: true,
              status: true,
              borrowedById: true,
              eventUsages: {
                where: { returnedAt: null },
                select: {
                  event: { select: { startDate: true, endDate: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!event) return null;

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    clientName: event.clientName,
    firmsNames: event.firmsNames,
    startDate: event.startDate,
    endDate: event.endDate,
    participants: event.participants.map((p) => ({
      id: p.member.id,
      name: p.member.name,
    })),
    tools: event.usedTools.map((t) => ({
      id: t.tool.id,
      name: t.tool.name,
      status: deriveToolStatus(t.tool),
      assignedAt: t.assignedAt,
      returnedAt: t.returnedAt,
    })),
  };
}

module.exports = { getEventDetails };
