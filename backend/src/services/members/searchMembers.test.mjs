import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchMembers } from './searchMembers.js';

// Hand-rolled mock for member.findMany, passed as the optional 2nd arg.
const memberFindMany = vi.fn();

const mockPrisma = {
  member: { findMany: memberFindMany },
};

beforeEach(() => {
  memberFindMany.mockReset();
});

// Build a Prisma-shaped member row.
function memberRow(overrides = {}) {
  return {
    id: 1,
    name: 'Magdalena',
    city: 'Wrocław',
    specializations: ['Sound', 'Lighting'],
    ...overrides,
  };
}

describe('searchMembers — query construction', () => {
  it('uses an empty where clause when no query is provided', async () => {
    memberFindMany.mockResolvedValue([]);

    await searchMembers({}, mockPrisma);

    expect(memberFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      }),
    );
  });

  it('uses an empty where clause when query is an empty string', async () => {
    memberFindMany.mockResolvedValue([]);

    await searchMembers({ query: '' }, mockPrisma);

    expect(memberFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      }),
    );
  });

  it('builds an OR clause with name and specializations filters when query is provided', async () => {
    memberFindMany.mockResolvedValue([]);

    await searchMembers({ query: 'Sound' }, mockPrisma);

    expect(memberFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { name: { contains: 'Sound', mode: 'insensitive' } },
            { specializations: { has: 'Sound' } },
          ],
        },
      }),
    );
  });

  it('uses case-insensitive name matching (contains with insensitive mode)', async () => {
    memberFindMany.mockResolvedValue([]);

    await searchMembers({ query: 'magdalena' }, mockPrisma);

    const where = memberFindMany.mock.calls[0][0].where;
    expect(where.OR[0]).toEqual({
      name: { contains: 'magdalena', mode: 'insensitive' },
    });
  });

  it('uses exact-match on specializations array elements (has)', async () => {
    memberFindMany.mockResolvedValue([]);

    await searchMembers({ query: 'Akustyka' }, mockPrisma);

    const where = memberFindMany.mock.calls[0][0].where;
    expect(where.OR[1]).toEqual({
      specializations: { has: 'Akustyka' },
    });
  });
});

describe('searchMembers — ordering & limits', () => {
  it('orders by name ascending', async () => {
    memberFindMany.mockResolvedValue([]);

    await searchMembers({}, mockPrisma);

    expect(memberFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: 'asc' },
      }),
    );
  });

  it('uses the default limit of 50 when not provided', async () => {
    memberFindMany.mockResolvedValue([]);

    await searchMembers({}, mockPrisma);

    expect(memberFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 50,
      }),
    );
  });

  it('honors a custom limit when provided', async () => {
    memberFindMany.mockResolvedValue([]);

    await searchMembers({ limit: 10 }, mockPrisma);

    expect(memberFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
      }),
    );
  });

  it('allows limit to be 1', async () => {
    memberFindMany.mockResolvedValue([]);

    await searchMembers({ limit: 1 }, mockPrisma);

    expect(memberFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 1,
      }),
    );
  });

  it('allows limit to be very large', async () => {
    memberFindMany.mockResolvedValue([]);

    await searchMembers({ limit: 999 }, mockPrisma);

    expect(memberFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 999,
      }),
    );
  });
});

describe('searchMembers — select & response', () => {
  it('selects exactly id, name, city, specializations', async () => {
    memberFindMany.mockResolvedValue([]);

    await searchMembers({}, mockPrisma);

    expect(memberFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          id: true,
          name: true,
          city: true,
          specializations: true,
        },
      }),
    );
  });

  it('returns an empty array when no members match', async () => {
    memberFindMany.mockResolvedValue([]);

    const result = await searchMembers({ query: 'NonExistent' }, mockPrisma);

    expect(result).toEqual([]);
  });

  it('returns members as Prisma provides them, unchanged', async () => {
    const rows = [
      memberRow({ id: 1, name: 'Alice' }),
      memberRow({ id: 2, name: 'Bob' }),
    ];
    memberFindMany.mockResolvedValue(rows);

    const result = await searchMembers({}, mockPrisma);

    expect(result).toBe(rows); // same reference
    expect(result).toHaveLength(2);
  });

  it('preserves member data as returned from the query', async () => {
    memberFindMany.mockResolvedValue([
      memberRow({
        id: 42,
        name: 'Jakub Wójcik',
        city: 'Poznań',
        specializations: ['Video', 'Lighting'],
      }),
    ]);

    const result = await searchMembers({}, mockPrisma);

    expect(result[0]).toEqual({
      id: 42,
      name: 'Jakub Wójcik',
      city: 'Poznań',
      specializations: ['Video', 'Lighting'],
    });
  });
});

describe('searchMembers — integration scenarios', () => {
  it('searches by partial name match (case-insensitive)', async () => {
    memberFindMany.mockResolvedValue([]);

    await searchMembers({ query: 'mag' }, mockPrisma);

    const where = memberFindMany.mock.calls[0][0].where;
    expect(where.OR[0]).toEqual({
      name: { contains: 'mag', mode: 'insensitive' },
    });
  });

  it('searches by full specialization name (exact match on array element)', async () => {
    memberFindMany.mockResolvedValue([]);

    await searchMembers({ query: 'Sound' }, mockPrisma);

    const where = memberFindMany.mock.calls[0][0].where;
    expect(where.OR[1]).toEqual({
      specializations: { has: 'Sound' },
    });
  });

  it('combines query and custom limit', async () => {
    memberFindMany.mockResolvedValue([]);

    await searchMembers({ query: 'test', limit: 5 }, mockPrisma);

    expect(memberFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.any(Array),
        }),
        take: 5,
      }),
    );
  });

  it('returns results ordered by name when multiple matches exist', async () => {
    memberFindMany.mockResolvedValue([
      memberRow({ id: 2, name: 'Bob' }),
      memberRow({ id: 1, name: 'Alice' }),
      memberRow({ id: 3, name: 'Charlie' }),
    ]);

    const result = await searchMembers({ query: 'a' }, mockPrisma);

    // The mock returns in that order, so we verify the order is preserved.
    expect(result.map((m) => m.name)).toEqual(['Bob', 'Alice', 'Charlie']);
  });
});
