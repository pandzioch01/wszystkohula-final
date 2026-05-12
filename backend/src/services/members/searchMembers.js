const prisma = require('../../config/prisma');

async function searchMembers({ query, limit = 50 }) {
  // Match on name (case-insensitive substring) OR on a specialization
  // element. Prisma's array `has` filter is exact-match per element, so the
  // user types e.g. "Akustyka" in full to match the spec; partial name
  // matches still work via `contains`.
  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { specializations: { has: query } },
        ],
      }
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
