import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchTools } from './searchTools.js';

// Hand-rolled mock for tool.findMany, passed as the optional 2nd arg.
const toolFindMany = vi.fn();

const mockPrisma = {
  tool: { findMany: toolFindMany },
};

beforeEach(() => {
  toolFindMany.mockReset();
});

// Build a Prisma-shaped tool row.
function toolRow(overrides = {}) {
  return {
    id: 1,
    name: 'Speaker',
    status: 'IN_STORAGE',
    imageUrl: 'https://example.com/speaker.jpg',
    borrowedById: null,
    eventUsages: [],
    ...overrides,
  };
}

describe('searchTools — query construction', () => {
  it('uses an empty where clause when no query or status is provided', async () => {
    toolFindMany.mockResolvedValue([]);

    await searchTools({}, mockPrisma);

    expect(toolFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      }),
    );
  });

  it('builds an OR condition for name/owner search when query is provided', async () => {
    toolFindMany.mockResolvedValue([]);

    await searchTools({ query: 'Speaker' }, mockPrisma);

    expect(toolFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: 'Speaker', mode: 'insensitive' } },
                { owner: { contains: 'Speaker', mode: 'insensitive' } },
              ],
            },
          ],
        },
      }),
    );
  });

  it('uses case-insensitive matching for name', async () => {
    toolFindMany.mockResolvedValue([]);

    await searchTools({ query: 'speaker' }, mockPrisma);

    const where = toolFindMany.mock.calls[0][0].where;
    expect(where.AND[0].OR[0]).toEqual({
      name: { contains: 'speaker', mode: 'insensitive' },
    });
  });

  it('uses case-insensitive matching for owner', async () => {
    toolFindMany.mockResolvedValue([]);

    await searchTools({ query: 'John' }, mockPrisma);

    const where = toolFindMany.mock.calls[0][0].where;
    expect(where.AND[0].OR[1]).toEqual({
      owner: { contains: 'John', mode: 'insensitive' },
    });
  });

  it('does not filter by status in the WHERE clause (status is applied after deriving)', async () => {
    toolFindMany.mockResolvedValue([]);

    await searchTools({ status: 'BORROWED' }, mockPrisma);

    const where = toolFindMany.mock.calls[0][0].where;
    expect(where).not.toHaveProperty('status');
  });
});

describe('searchTools — ordering & select', () => {
  it('orders by name ascending', async () => {
    toolFindMany.mockResolvedValue([]);

    await searchTools({}, mockPrisma);

    expect(toolFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: 'asc' },
      }),
    );
  });

  it('selects the required fields for deriving status', async () => {
    toolFindMany.mockResolvedValue([]);

    await searchTools({}, mockPrisma);

    expect(toolFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
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
      }),
    );
  });
});

describe('searchTools — status mapping & filtering', () => {
  it('derives tool status for each result', async () => {
    toolFindMany.mockResolvedValue([
      toolRow({ id: 1, name: 'Tool1', status: 'IN_STORAGE' }),
    ]);

    const result = await searchTools({}, mockPrisma);

    expect(result[0].status).toBe('IN_STORAGE');
  });

  it('removes borrowedById and eventUsages from the response', async () => {
    toolFindMany.mockResolvedValue([
      toolRow({ id: 1, borrowedById: 42, eventUsages: [{ event: {} }] }),
    ]);

    const result = await searchTools({}, mockPrisma);

    expect(result[0]).not.toHaveProperty('borrowedById');
    expect(result[0]).not.toHaveProperty('eventUsages');
  });

  it('preserves id, name, imageUrl in the response', async () => {
    toolFindMany.mockResolvedValue([
      toolRow({
        id: 99,
        name: 'Mixer',
        imageUrl: 'https://example.com/mixer.jpg',
      }),
    ]);

    const result = await searchTools({}, mockPrisma);

    expect(result[0]).toMatchObject({
      id: 99,
      name: 'Mixer',
      imageUrl: 'https://example.com/mixer.jpg',
    });
  });

  it('filters by derived status when status parameter is provided', async () => {
    toolFindMany.mockResolvedValue([
      toolRow({ id: 1, name: 'Borrowed', status: 'IN_STORAGE', borrowedById: 5 }),
      toolRow({ id: 2, name: 'InStorage', status: 'IN_STORAGE', borrowedById: null }),
      toolRow({ id: 3, name: 'Lost', status: 'LOST', borrowedById: null }),
    ]);

    const result = await searchTools({ status: 'BORROWED' }, mockPrisma);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
    expect(result[0].status).toBe('BORROWED');
  });

  it('returns empty array when no tools match the status filter', async () => {
    toolFindMany.mockResolvedValue([
      toolRow({ id: 1, status: 'IN_STORAGE', borrowedById: null }),
      toolRow({ id: 2, status: 'IN_STORAGE', borrowedById: null }),
    ]);

    const result = await searchTools({ status: 'BORROWED' }, mockPrisma);

    expect(result).toEqual([]);
  });
});

describe('searchTools — limits', () => {
  it('uses the default limit of 50 when not provided', async () => {
    const tools = Array.from({ length: 100 }, (_, i) =>
      toolRow({ id: i + 1, name: `Tool${i + 1}` }),
    );
    toolFindMany.mockResolvedValue(tools);

    const result = await searchTools({}, mockPrisma);

    expect(result).toHaveLength(50);
  });

  it('honors a custom limit', async () => {
    const tools = Array.from({ length: 100 }, (_, i) =>
      toolRow({ id: i + 1, name: `Tool${i + 1}` }),
    );
    toolFindMany.mockResolvedValue(tools);

    const result = await searchTools({ limit: 10 }, mockPrisma);

    expect(result).toHaveLength(10);
  });

  it('returns fewer results when the DB has fewer tools than the limit', async () => {
    toolFindMany.mockResolvedValue([
      toolRow({ id: 1 }),
      toolRow({ id: 2 }),
      toolRow({ id: 3 }),
    ]);

    const result = await searchTools({ limit: 50 }, mockPrisma);

    expect(result).toHaveLength(3);
  });

  it('applies the limit after deriving status and filtering', async () => {
    // Create 100 tools, 20 of which are BORROWED
    const tools = Array.from({ length: 100 }, (_, i) =>
      toolRow({
        id: i + 1,
        name: `Tool${i + 1}`,
        borrowedById: i < 20 ? i + 1 : null,
      }),
    );
    toolFindMany.mockResolvedValue(tools);

    const result = await searchTools({ status: 'BORROWED', limit: 10 }, mockPrisma);

    expect(result).toHaveLength(10);
    expect(result.every((t) => t.status === 'BORROWED')).toBe(true);
  });
});

describe('searchTools — combined query & status', () => {
  it('applies both query and status filters', async () => {
    toolFindMany.mockResolvedValue([
      toolRow({ id: 1, name: 'Speaker', owner: null, borrowedById: 5 }),
      toolRow({ id: 2, name: 'Microphone', owner: null, borrowedById: null }),
      toolRow({ id: 3, name: 'Speaker Stand', owner: null, borrowedById: null }),
    ]);

    const result = await searchTools({ query: 'Speaker', status: 'BORROWED' }, mockPrisma);

    // Only tool 1: name matches "Speaker", status derives to "BORROWED"
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it('returns empty when query matches but status filter does not', async () => {
    toolFindMany.mockResolvedValue([
      toolRow({ id: 1, name: 'Speaker', borrowedById: null }),
    ]);

    const result = await searchTools({ query: 'Speaker', status: 'BORROWED' }, mockPrisma);

    expect(result).toEqual([]);
  });
});

describe('searchTools — edge cases', () => {
  it('returns empty array when no tools exist', async () => {
    toolFindMany.mockResolvedValue([]);

    const result = await searchTools({ query: 'anything' }, mockPrisma);

    expect(result).toEqual([]);
  });

  it('handles tools with null imageUrl', async () => {
    toolFindMany.mockResolvedValue([
      toolRow({ id: 1, imageUrl: null }),
    ]);

    const result = await searchTools({}, mockPrisma);

    expect(result[0].imageUrl).toBeNull();
  });

  it('preserves owner field if present', async () => {
    toolFindMany.mockResolvedValue([
      toolRow({ id: 1, name: 'Test', owner: 'John Doe' }),
    ]);

    const result = await searchTools({}, mockPrisma);

    expect(result[0]).toHaveProperty('owner');
    expect(result[0].owner).toBe('John Doe');
  });

  it('preserves the order from Prisma (by name asc)', async () => {
    toolFindMany.mockResolvedValue([
      toolRow({ id: 2, name: 'Beta' }),
      toolRow({ id: 1, name: 'Alpha' }),
      toolRow({ id: 3, name: 'Gamma' }),
    ]);

    const result = await searchTools({}, mockPrisma);

    expect(result.map((t) => t.name)).toEqual(['Beta', 'Alpha', 'Gamma']);
  });
});
