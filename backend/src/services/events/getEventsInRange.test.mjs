import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEventsInRange } from './getEventsInRange.js';

// Plain mock satisfying the shape `getEventsInRange` uses (prisma.event.findMany).
// Passed directly into the service via the optional second arg — no vi.mock,
// no DB connection.
const findManyMock = vi.fn();
const mockPrisma = {
  event: { findMany: findManyMock },
};

beforeEach(() => {
  findManyMock.mockReset();
});

// Lightweight event row builder — the service doesn't transform results, so
// whatever Prisma returns flows straight through. These rows are only here
// to verify pass-through in the result tests.
function eventRow(overrides = {}) {
  return {
    id: 1,
    title: 'Sample event',
    startDate: new Date('2026-05-10T10:00:00Z'),
    endDate: new Date('2026-05-11T18:00:00Z'),
    ...overrides,
  };
}

describe('getEventsInRange — query construction', () => {
  it('builds an AND of (startDate < end) and (endDate >= start) when both bounds are given', async () => {
    findManyMock.mockResolvedValue([]);
    const start = new Date('2026-05-01T00:00:00Z');
    const end = new Date('2026-06-01T00:00:00Z');

    await getEventsInRange({ start, end }, mockPrisma);

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { startDate: { lt: end } },
            { endDate: { gte: start } },
          ],
        },
      }),
    );
  });

  it('filters only by endDate >= start when end is not given', async () => {
    findManyMock.mockResolvedValue([]);
    const start = new Date('2026-05-01T00:00:00Z');

    await getEventsInRange({ start }, mockPrisma);

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { endDate: { gte: start } },
      }),
    );
  });

  it('filters only by startDate < end when start is not given', async () => {
    findManyMock.mockResolvedValue([]);
    const end = new Date('2026-06-01T00:00:00Z');

    await getEventsInRange({ end }, mockPrisma);

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { startDate: { lt: end } },
      }),
    );
  });

  it('passes an empty where when neither bound is given', async () => {
    findManyMock.mockResolvedValue([]);

    await getEventsInRange({}, mockPrisma);

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });
});

describe('getEventsInRange — ordering, limit, select', () => {
  it('always orders by startDate ascending', async () => {
    findManyMock.mockResolvedValue([]);

    await getEventsInRange({}, mockPrisma);

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { startDate: 'asc' } }),
    );
  });

  it('uses a default limit of 500 when none is provided', async () => {
    findManyMock.mockResolvedValue([]);

    await getEventsInRange({}, mockPrisma);

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ take: 500 }),
    );
  });

  it('honors a custom limit', async () => {
    findManyMock.mockResolvedValue([]);

    await getEventsInRange({ limit: 10 }, mockPrisma);

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 }),
    );
  });

  it('selects only id, title, startDate, endDate', async () => {
    findManyMock.mockResolvedValue([]);

    await getEventsInRange({}, mockPrisma);

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
        },
      }),
    );
  });
});

describe('getEventsInRange — result pass-through', () => {
  it('returns whatever Prisma returns, unchanged', async () => {
    const rows = [
      eventRow({ id: 1, title: 'A' }),
      eventRow({ id: 2, title: 'B' }),
    ];
    findManyMock.mockResolvedValue(rows);

    const result = await getEventsInRange({}, mockPrisma);

    expect(result).toBe(rows); // same reference — service doesn't map/transform
  });

  it('returns an empty array when Prisma returns no rows', async () => {
    findManyMock.mockResolvedValue([]);

    const result = await getEventsInRange(
      { start: new Date('2026-01-01'), end: new Date('2026-01-31') },
      mockPrisma,
    );

    expect(result).toEqual([]);
  });
});
