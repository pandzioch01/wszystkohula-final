const prisma = require('../../config/prisma');
const { deriveToolStatus } = require('./deriveToolStatus');

async function searchTools({ query, status, limit = 50 }) {
  const conditions = [];

  // Text search: matches name OR owner (both case-insensitive substring).
  if (query) {
    conditions.push({
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { owner: { contains: query, mode: 'insensitive' } },
      ],
    });
  }

  // Note: we don't filter by `status` in the WHERE clause because the
  // displayed status is *derived* (a tool stored as AT_EVENT may render as
  // IN_STORAGE once its event ends). Filter on the derived value after
  // deriving it.

  const where = conditions.length > 0 ? { AND: conditions } : {};

  const tools = await prisma.tool.findMany({
    where,
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      status: true,
      imageUrl: true,
      borrowedById: true,
      eventUsages: {
        where: { returnedAt: null },
        select: {
          event: { select: { startDate: true, endDate: true } },
        },
      },
    },
  });

  let result = tools.map((t) => {
    const derived = deriveToolStatus(t);
    const { borrowedById, eventUsages, ...rest } = t;
    return { ...rest, status: derived };
  });

  if (status) {
    result = result.filter((t) => t.status === status);
  }

  return result.slice(0, limit);
}

module.exports = { searchTools };
