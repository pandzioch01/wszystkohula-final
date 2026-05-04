const prisma = require('../../config/prisma');

async function getToolProfile(toolId) {
  const tool = await prisma.tool.findUnique({
    where: { id: toolId },
    select: {
      id: true,
      name: true,
      status: true,
      imageUrl: true,
      borrowedSince: true,
      borrowedBy: { select: { id: true, name: true } },
    },
  });

  if (!tool) return null;

  const now = new Date();

  // Prefer the soonest upcoming event using this tool;
  // if none, fall back to the most recent past event.
  let nearestUsage = await prisma.eventTool.findFirst({
    where: { toolId, event: { startDate: { gte: now } } },
    orderBy: { event: { startDate: 'asc' } },
    select: {
      event: { select: { id: true, title: true, startDate: true } },
    },
  });

  if (!nearestUsage) {
    nearestUsage = await prisma.eventTool.findFirst({
      where: { toolId, event: { startDate: { lt: now } } },
      orderBy: { event: { startDate: 'desc' } },
      select: {
        event: { select: { id: true, title: true, startDate: true } },
      },
    });
  }

  return {
    id: tool.id,
    name: tool.name,
    status: tool.status,
    imageUrl: tool.imageUrl,
    borrowedBy: tool.borrowedBy,
    borrowedSince: tool.borrowedSince,
    nearestEvent: nearestUsage?.event ?? null,
  };
}

module.exports = { getToolProfile };
