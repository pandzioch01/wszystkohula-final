const defaultPrisma = require('../../config/prisma');

// Optional `prisma` mirrors the sibling services:
// production callers omit it and get the real singleton; tests pass a mock.
async function getMemberProfile(memberId, prisma = defaultPrisma) {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      name: true,
      city: true,
      specializations: true,
      ownedTools: true,
    },
  });

  if (!member) return null;

  const nextParticipation = await prisma.eventParticipant.findFirst({
    where: {
      memberId,
      event: { startDate: { gt: new Date() } },
    },
    orderBy: { event: { startDate: 'asc' } },
    select: {
      event: { select: { id: true, title: true, startDate: true } },
    },
  });

  // Tools personally borrowed by this member. `Tool.borrowedById` is the
  // single source of truth — each tool has at most one borrower, so unlike
  // the old eventTool-via-participants query this can't return duplicates
  // shared with other event participants.
  const borrowedTools = await prisma.tool.findMany({
    where: { borrowedById: memberId },
    select: { name: true, status: true },
    orderBy: { name: 'asc' },
  });

  return {
    id: member.id,
    name: member.name,
    city: member.city,
    specializations: member.specializations,
    ownedTools: member.ownedTools,
    borrowedTools,
    nextEvent: nextParticipation?.event ?? null,
  };
}

module.exports = { getMemberProfile };
