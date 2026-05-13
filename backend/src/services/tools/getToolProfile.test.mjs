import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getToolProfile } from './getToolProfile.js';

// Hand-rolled mocks for the two Prisma surfaces getToolProfile touches:
// tool.findUnique and eventTool.findFirst (called up to 3 times).
// Passed as the optional 2nd arg.
const toolFindUnique = vi.fn();
const eventToolFindFirst = vi.fn();

const mockPrisma = {
  tool: { findUnique: toolFindUnique },
  eventTool: { findFirst: eventToolFindFirst },
};

beforeEach(() => {
  toolFindUnique.mockReset();
  eventToolFindFirst.mockReset();

  // Sensible defaults — tests override as needed.
  toolFindUnique.mockResolvedValue({
    id: 1,
    name: 'Amplifier',
    status: 'IN_STORAGE',
    imageUrl: 'https://example.com/amp.jpg',
    owner: 'Org',
    borrowedById: null,
    borrowedSince: null,
    borrowedBy: null,
    eventUsages: [],
  });
  eventToolFindFirst.mockResolvedValue(null);
});

describe('getToolProfile — basic lookup', () => {
  it('queries tool by id', async () => {
    await getToolProfile(42, mockPrisma);

    expect(toolFindUnique).toHaveBeenCalledWith({
      where: { id: 42 },
      select: {
        id: true,
        name: true,
        status: true,
        imageUrl: true,
        owner: true,
        borrowedById: true,
        borrowedSince: true,
        borrowedBy: { select: { id: true, name: true } },
        eventUsages: {
          where: { returnedAt: null },
          select: {
            event: { select: { startDate: true, endDate: true } },
          },
        },
      },
    });
  });

  it('returns null when tool does not exist', async () => {
    toolFindUnique.mockResolvedValueOnce(null);

    const result = await getToolProfile(999, mockPrisma);

    expect(result).toBeNull();
  });

  it('does not query eventTool when tool is not found', async () => {
    toolFindUnique.mockResolvedValueOnce(null);

    await getToolProfile(999, mockPrisma);

    expect(eventToolFindFirst).not.toHaveBeenCalled();
  });
});

describe('getToolProfile — nearest event priority 1 (running event)', () => {
  it('prioritizes a currently running event', async () => {
    const now = new Date('2026-05-10T15:00:00Z');
    toolFindUnique.mockResolvedValueOnce({
      id: 1,
      name: 'Speaker',
      status: 'AT_EVENT',
      imageUrl: null,
      owner: null,
      borrowedById: null,
      borrowedSince: null,
      borrowedBy: null,
      eventUsages: [
        {
          event: {
            startDate: new Date('2026-05-10T10:00:00Z'),
            endDate: new Date('2026-05-10T20:00:00Z'),
          },
        },
      ],
    });
    eventToolFindFirst.mockResolvedValueOnce({
      event: {
        id: 10,
        title: 'Festival',
        startDate: new Date('2026-05-10T10:00:00Z'),
        endDate: new Date('2026-05-10T20:00:00Z'),
      },
    });

    const result = await getToolProfile(1, mockPrisma);

    // Should call findFirst with the running-event query (start <= now <= end)
    expect(eventToolFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          toolId: 1,
          event: {
            startDate: { lte: expect.any(Date) },
            endDate: { gte: expect.any(Date) },
          },
        },
      }),
    );
    expect(result.nearestEvent.title).toBe('Festival');
  });

  it('does not query for upcoming/past events when a running event is found', async () => {
    eventToolFindFirst.mockResolvedValueOnce({
      event: { id: 10, title: 'Running', startDate: new Date(), endDate: new Date() },
    });

    await getToolProfile(1, mockPrisma);

    // Should only call findFirst once (for running event)
    expect(eventToolFindFirst).toHaveBeenCalledTimes(1);
  });
});

describe('getToolProfile — nearest event priority 2 (upcoming event)', () => {
  it('queries for upcoming event when no running event exists', async () => {
    eventToolFindFirst
      .mockResolvedValueOnce(null) // no running event
      .mockResolvedValueOnce({
        event: {
          id: 20,
          title: 'Upcoming',
          startDate: new Date('2026-06-01T10:00:00Z'),
          endDate: new Date('2026-06-02T20:00:00Z'),
        },
      });

    const result = await getToolProfile(1, mockPrisma);

    // First call: running event (returns null)
    // Second call: upcoming event (returns result)
    expect(eventToolFindFirst).toHaveBeenCalledTimes(2);
    expect(eventToolFindFirst.mock.calls[1][0]).toMatchObject({
      where: {
        toolId: 1,
        event: { startDate: { gt: expect.any(Date) } },
      },
      orderBy: { event: { startDate: 'asc' } },
    });
    expect(result.nearestEvent.title).toBe('Upcoming');
  });

  it('does not query for past events when an upcoming event is found', async () => {
    eventToolFindFirst
      .mockResolvedValueOnce(null) // no running
      .mockResolvedValueOnce({
        event: {
          id: 20,
          title: 'Upcoming',
          startDate: new Date('2026-06-01T10:00:00Z'),
          endDate: new Date('2026-06-02T20:00:00Z'),
        },
      });

    await getToolProfile(1, mockPrisma);

    // Should only call findFirst twice (running + upcoming)
    expect(eventToolFindFirst).toHaveBeenCalledTimes(2);
  });

  it('orders upcoming events by startDate ascending (soonest first)', async () => {
    eventToolFindFirst
      .mockResolvedValueOnce(null) // no running
      .mockResolvedValueOnce({
        event: { id: 20, title: 'Soonest', startDate: new Date(), endDate: new Date() },
      });

    await getToolProfile(1, mockPrisma);

    const upcomingQuery = eventToolFindFirst.mock.calls[1][0];
    expect(upcomingQuery.orderBy).toEqual({ event: { startDate: 'asc' } });
  });
});

describe('getToolProfile — nearest event priority 3 (past event)', () => {
  it('queries for most recent past event when no running/upcoming exists', async () => {
    eventToolFindFirst
      .mockResolvedValueOnce(null) // no running
      .mockResolvedValueOnce(null) // no upcoming
      .mockResolvedValueOnce({
        event: {
          id: 30,
          title: 'Recent past',
          startDate: new Date('2026-05-01T10:00:00Z'),
          endDate: new Date('2026-05-02T20:00:00Z'),
        },
      });

    const result = await getToolProfile(1, mockPrisma);

    expect(eventToolFindFirst).toHaveBeenCalledTimes(3);
    expect(eventToolFindFirst.mock.calls[2][0]).toMatchObject({
      where: {
        toolId: 1,
        event: { endDate: { lt: expect.any(Date) } },
      },
      orderBy: { event: { endDate: 'desc' } },
    });
    expect(result.nearestEvent.title).toBe('Recent past');
  });

  it('orders past events by endDate descending (most recent first)', async () => {
    eventToolFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        event: { id: 30, title: 'Past', startDate: new Date(), endDate: new Date() },
      });

    await getToolProfile(1, mockPrisma);

    const pastQuery = eventToolFindFirst.mock.calls[2][0];
    expect(pastQuery.orderBy).toEqual({ event: { endDate: 'desc' } });
  });
});

describe('getToolProfile — nearest event fallback', () => {
  it('sets nearestEvent to null when no running/upcoming/past events exist', async () => {
    eventToolFindFirst
      .mockResolvedValueOnce(null) // no running
      .mockResolvedValueOnce(null) // no upcoming
      .mockResolvedValueOnce(null); // no past

    const result = await getToolProfile(1, mockPrisma);

    expect(result.nearestEvent).toBeNull();
  });

  it('exhausts all three priority levels before giving up', async () => {
    eventToolFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    await getToolProfile(1, mockPrisma);

    expect(eventToolFindFirst).toHaveBeenCalledTimes(3);
  });
});

describe('getToolProfile — response shape & deriveToolStatus', () => {
  it('flattens all tool fields into the response', async () => {
    toolFindUnique.mockResolvedValueOnce({
      id: 99,
      name: 'Mixer',
      status: 'IN_STORAGE',
      imageUrl: 'https://example.com/mixer.jpg',
      owner: 'John',
      borrowedById: 5,
      borrowedSince: new Date('2026-05-01T00:00:00Z'),
      borrowedBy: { id: 5, name: 'Jane' },
      eventUsages: [],
    });
    eventToolFindFirst.mockResolvedValueOnce(null);

    const result = await getToolProfile(99, mockPrisma);

    expect(result).toMatchObject({
      id: 99,
      name: 'Mixer',
      imageUrl: 'https://example.com/mixer.jpg',
      owner: 'John',
      borrowedBy: { id: 5, name: 'Jane' },
      borrowedSince: expect.any(Date),
    });
  });

  it('includes the derived status (not the stored status)', async () => {
    toolFindUnique.mockResolvedValueOnce({
      id: 1,
      name: 'Speaker',
      status: 'AT_EVENT',
      imageUrl: null,
      owner: null,
      borrowedById: null,
      borrowedSince: null,
      borrowedBy: null,
      eventUsages: [], // no running events
    });
    eventToolFindFirst.mockResolvedValueOnce(null);

    const result = await getToolProfile(1, mockPrisma);

    // Stored status is AT_EVENT, but derived should be IN_STORAGE (no running event)
    expect(result.status).toBe('IN_STORAGE');
  });

  it('passes the tool and a current timestamp to deriveToolStatus', async () => {
    toolFindUnique.mockResolvedValueOnce({
      id: 1,
      name: 'Test',
      status: 'AT_EVENT',
      imageUrl: null,
      owner: null,
      borrowedById: null,
      borrowedSince: null,
      borrowedBy: null,
      eventUsages: [
        {
          event: {
            // Will be evaluated with the current time
            startDate: new Date('2026-05-10T10:00:00Z'),
            endDate: new Date('2026-05-10T20:00:00Z'),
          },
        },
      ],
    });
    eventToolFindFirst.mockResolvedValueOnce(null);

    const result = await getToolProfile(1, mockPrisma);

    // The status derivation uses the current time, so behavior depends on when the test runs.
    // Since the event is in the past, it should downgrade to IN_STORAGE.
    expect(result.status).toBe('IN_STORAGE');
  });

  it('includes nearestEvent in the response', async () => {
    eventToolFindFirst.mockResolvedValueOnce({
      event: { id: 10, title: 'Some Event', startDate: new Date(), endDate: new Date() },
    });

    const result = await getToolProfile(1, mockPrisma);

    expect(result).toHaveProperty('nearestEvent');
    expect(result.nearestEvent).toMatchObject({
      id: 10,
      title: 'Some Event',
    });
  });

  it('returns the complete profile with all fields', async () => {
    toolFindUnique.mockResolvedValueOnce({
      id: 1,
      name: 'Complete Tool',
      status: 'IN_STORAGE',
      imageUrl: 'https://example.com/tool.jpg',
      owner: 'Owner',
      borrowedById: null,
      borrowedSince: null,
      borrowedBy: null,
      eventUsages: [],
    });
    eventToolFindFirst.mockResolvedValueOnce({
      event: { id: 5, title: 'Event', startDate: new Date(), endDate: new Date() },
    });

    const result = await getToolProfile(1, mockPrisma);

    expect(result).toEqual({
      id: 1,
      name: 'Complete Tool',
      status: 'IN_STORAGE',
      imageUrl: 'https://example.com/tool.jpg',
      owner: 'Owner',
      borrowedBy: null,
      borrowedSince: null,
      nearestEvent: {
        id: 5,
        title: 'Event',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      },
    });
  });

  it('handles null imageUrl, owner, and borrowedBy', async () => {
    toolFindUnique.mockResolvedValueOnce({
      id: 1,
      name: 'Minimal',
      status: 'IN_STORAGE',
      imageUrl: null,
      owner: null,
      borrowedById: null,
      borrowedSince: null,
      borrowedBy: null,
      eventUsages: [],
    });
    eventToolFindFirst.mockResolvedValueOnce(null);

    const result = await getToolProfile(1, mockPrisma);

    expect(result.imageUrl).toBeNull();
    expect(result.owner).toBeNull();
    expect(result.borrowedBy).toBeNull();
    expect(result.borrowedSince).toBeNull();
    expect(result.nearestEvent).toBeNull();
  });
});
