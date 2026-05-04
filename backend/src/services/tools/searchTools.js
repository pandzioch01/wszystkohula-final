const prisma = require('../../config/prisma');

async function searchTools({ query, limit = 50 }) {
  const where = query
    ? { name: { contains: query, mode: 'insensitive' } }
    : {};

  return prisma.tool.findMany({
    where,
    orderBy: { name: 'asc' },
    take: limit,
    select: {
      id: true,
      name: true,
      status: true,
      imageUrl: true,
    },
  });
}

module.exports = { searchTools };
