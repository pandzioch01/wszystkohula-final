const prisma = require('../../config/prisma');

async function getEventsInRange({ start, end, limit = 500 }) {
  const where = {};

  // Event overlaps the window if startDate < end AND endDate >= start.
  // Each bound is optional so the endpoint also works with one side or neither.
  if (start && end) {
    where.AND = [
      { startDate: { lt: end } },
      { endDate: { gte: start } },
    ];
  } else if (start) {
    where.endDate = { gte: start };
  } else if (end) {
    where.startDate = { lt: end };
  }

  return prisma.event.findMany({
    where,
    orderBy: { startDate: 'asc' },
    take: limit,
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
    },
  });
}

module.exports = { getEventsInRange };
