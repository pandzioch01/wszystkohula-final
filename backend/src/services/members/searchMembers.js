const prisma = require('../../config/prisma');

async function searchMembers({ query, limit = 50 }) {
  const where = query
    ? { name: { contains: query, mode: 'insensitive' } }
    : {};

  return prisma.member.findMany({
    where,
    orderBy: { name: 'asc' },
    take: limit,
    select: {
      id: true,
      name: true,
      city: true,
      specializations: true,
    },
  });
}

module.exports = { searchMembers };
