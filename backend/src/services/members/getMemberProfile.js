const prisma = require('../../config/prisma');

async function getMemberProfile(memberId) {
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

  const borrowedAssignments = await prisma.eventTool.findMany({
    where: {
      returnedAt: null,
      event: { participants: { some: { memberId } } },
    },
    select: {
      assignedAt: true,
      tool: { select: { id: true, name: true, status: true } },
      event: { select: { id: true, title: true } },
    },
  });

  return {
    id: member.id,
    name: member.name,
    city: member.city,
    specializations: member.specializations,
    ownedTools: member.ownedTools,
    borrowedTools: borrowedAssignments.map((a) => ({
      name: a.tool.name,
      status: a.tool.status,
    })),
    nextEvent: nextParticipation?.event ?? null,
  };
}

module.exports = { getMemberProfile };
