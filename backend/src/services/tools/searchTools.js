const prisma = require('../../config/prisma');

async function searchTools({ query, limit = 50 }) {
  const tools = await prisma.tool.findMany({
    where: query
      ? { name: { contains: query, mode: 'insensitive' } }
      : {},
    orderBy: { name: 'asc' },
    take: limit,
    select: {
      id: true,
      name: true,
      status: true,
      imageUrl: true,
      borrowedById: true,
    },
  });

  // Derive a consistent status: if a borrower is set, the tool is BORROWED
  // regardless of the stored enum (defensive against drift).
  return tools.map(({ borrowedById, ...t }) => ({
    ...t,
    status: borrowedById !== null ? 'BORROWED' : t.status,
  }));
}

module.exports = { searchTools };
