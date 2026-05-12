const prisma = require('../../config/prisma');
const { deriveToolStatus } = require('./deriveToolStatus');

async function getToolProfile(toolId) {
  const tool = await prisma.tool.findUnique({
    where: { id: toolId },
    select: {
      id: true,
      name: true,
      status: true,
      imageUrl: true,
      owner: true,
      borrowedById: true,
      borrowedSince: true,
      borrowedBy: { select: { id: true, name: true } },
      eventUsages: {
        where: { returnedAt: null },
        select: {
          event: { select: { startDate: true, endDate: true } },
        },
      },
    },
  });

  if (!tool) return null;

  const now = new Date();

  // Priority for the "nearest event" pick:
  //   1. an event currently happening (start <= now <= end)
  //   2. otherwise the soonest upcoming event
  //   3. otherwise the most recent past event
  // This way, when a tool is AT_EVENT the UI always reflects the running one
  // even if the tool is also pre-assigned to a future event.
  const eventSelect = {
    event: { select: { id: true, title: true, startDate: true, endDate: true } },
  };

  let nearestUsage = await prisma.eventTool.findFirst({
    where: {
      toolId,
      event: { startDate: { lte: now }, endDate: { gte: now } },
    },
    select: eventSelect,
  });

  if (!nearestUsage) {
    nearestUsage = await prisma.eventTool.findFirst({
      where: { toolId, event: { startDate: { gt: now } } },
      orderBy: { event: { startDate: 'asc' } },
      select: eventSelect,
    });
  }

  if (!nearestUsage) {
    nearestUsage = await prisma.eventTool.findFirst({
      where: { toolId, event: { endDate: { lt: now } } },
      orderBy: { event: { endDate: 'desc' } },
      select: eventSelect,
    });
  }

  return {
    id: tool.id,
    name: tool.name,
    status: deriveToolStatus(tool, now),
    imageUrl: tool.imageUrl,
    owner: tool.owner,
    borrowedBy: tool.borrowedBy,
    borrowedSince: tool.borrowedSince,
    nearestEvent: nearestUsage?.event ?? null,
  };
}

module.exports = { getToolProfile };
