import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockReset } from 'vitest-mock-extended';

// Build a deep mock of the Prisma client and route the singleton import to it.
// `vi.hoisted` runs before any imports; using `await` is required because the
// factory is async (it dynamic-imports vitest-mock-extended).
const { mockPrisma } = await vi.hoisted(async () => {
  const { mockDeep } = await import('vitest-mock-extended');
  return { mockPrisma: mockDeep() };
});

// Our prisma module is CJS (`module.exports = prisma`). The service requires
// it as `require('../../config/prisma')` — note: no `.js`. Vitest's mock path
// must match that exactly, otherwise the real module loads and the mock is
// ignored. We expose the mock both as default and spread for CJS/ESM interop.
vi.mock('../../config/prisma', () => ({
  default: mockPrisma,
  ...mockPrisma,
}));

const { searchMembers } = await import('./searchMembers.js');

beforeEach(() => {
  mockReset(mockPrisma);
});

describe('searchMembers', () => {
  it('finds members by name OR specialization when query is provided', async () => {
    mockPrisma.member.findMany.mockResolvedValue([
      { id: 1, name: 'Anna Kowalska', city: 'Poznań', specializations: ['Akustyka'] },
    ]);

    const result = await searchMembers({ query: 'Akustyka' });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Anna Kowalska');

    // Verify the Prisma call shape: an OR with both branches
    expect(mockPrisma.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { name: { contains: 'Akustyka', mode: 'insensitive' } },
            { specializations: { has: 'Akustyka' } },
          ],
        },
        orderBy: { name: 'asc' },
        take: 50,
      }),
    );
  });

  it('returns all members (capped) when no query is provided', async () => {
    mockPrisma.member.findMany.mockResolvedValue([]);

    await searchMembers({});

    expect(mockPrisma.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {}, take: 50 }),
    );
  });

  it('honors a custom limit', async () => {
    mockPrisma.member.findMany.mockResolvedValue([]);

    await searchMembers({ query: 'x', limit: 10 });

    expect(mockPrisma.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 }),
    );
  });
});
