import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMemberChanges } from './getMemberChanges.js';

// Hand-rolled mock for eventChange.findMany, passed as the optional 2nd arg.
const eventChangeFindMany = vi.fn();

const mockPrisma = {
  eventChange: { findMany: eventChangeFindMany },
};

beforeEach(() => {
  eventChangeFindMany.mockReset();
});

// Build a Prisma-shaped change row — the service maps this into response format.
function changeRow(overrides = {}) {
  return {
    id: 1,
    changeType: 'CREATED',
    timestamp: new Date('2026-05-13T10:00:00Z'),
    description: 'Created event "Festival"',
    eventTitleSnapshot: 'Festival',
    event: { id: 10, title: 'Festival' },
    member: { id: 42, name: 'Magdalena' },
    ...overrides,
  };
}

describe('getMemberChanges — query construction', () => {
  it('queries eventChange rows filtered by memberId', async () => {
    eventChangeFindMany.mockResolvedValue([]);

    await getMemberChanges(99, mockPrisma);

    expect(eventChangeFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { memberId: 99 },
      }),
    );
  });

  it('orders by timestamp descending (newest first)', async () => {
    eventChangeFindMany.mockResolvedValue([]);

    await getMemberChanges(1, mockPrisma);

    expect(eventChangeFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { timestamp: 'desc' },
      }),
    );
  });

  it('selects the required fields including nested event and member', async () => {
    eventChangeFindMany.mockResolvedValue([]);

    await getMemberChanges(1, mockPrisma);

    expect(eventChangeFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          id: true,
          changeType: true,
          timestamp: true,
          description: true,
          eventTitleSnapshot: true,
          event: { select: { id: true, title: true } },
          member: { select: { id: true, name: true } },
        },
      }),
    );
  });
});

describe('getMemberChanges — response shape & mapping', () => {
  it('returns an empty array when no changes exist for the member', async () => {
    eventChangeFindMany.mockResolvedValue([]);

    const result = await getMemberChanges(999, mockPrisma);

    expect(result).toEqual([]);
  });

  it('flattens each change row into the response format', async () => {
    eventChangeFindMany.mockResolvedValue([
      changeRow({
        id: 1,
        changeType: 'CREATED',
        timestamp: new Date('2026-05-13T10:00:00Z'),
        description: 'Created event "Festival"',
        eventTitleSnapshot: 'Festival',
        event: { id: 10, title: 'Festival' },
        member: { id: 42, name: 'Magdalena' },
      }),
    ]);

    const result = await getMemberChanges(42, mockPrisma);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 1,
      changeType: 'CREATED',
      timestamp: expect.any(Date),
      description: 'Created event "Festival"',
      eventId: 10,
      eventTitle: 'Festival',
      memberId: 42,
      memberName: 'Magdalena',
    });
  });

  it('includes the constructed message field', async () => {
    eventChangeFindMany.mockResolvedValue([
      changeRow({
        changeType: 'CREATED',
        event: { id: 10, title: 'Festival' },
        member: { id: 42, name: 'Magdalena' },
      }),
    ]);

    const result = await getMemberChanges(42, mockPrisma);

    expect(result[0].message).toBe('Magdalena created event "Festival"');
  });

  it('returns multiple changes in the order Prisma provided (desc timestamp)', async () => {
    const now = new Date();
    eventChangeFindMany.mockResolvedValue([
      changeRow({ id: 1, timestamp: new Date(now.getTime() - 1000) }),
      changeRow({ id: 2, timestamp: new Date(now.getTime() - 2000) }),
    ]);

    const result = await getMemberChanges(42, mockPrisma);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });
});

describe('getMemberChanges — action label mapping', () => {
  it('maps CREATED to "created event"', async () => {
    eventChangeFindMany.mockResolvedValue([
      changeRow({ changeType: 'CREATED' }),
    ]);

    const result = await getMemberChanges(1, mockPrisma);
    expect(result[0].message).toMatch(/created event/);
  });

  it('maps UPDATED to "updated event"', async () => {
    eventChangeFindMany.mockResolvedValue([
      changeRow({ changeType: 'UPDATED' }),
    ]);

    const result = await getMemberChanges(1, mockPrisma);
    expect(result[0].message).toMatch(/updated event/);
  });

  it('maps DELETED to "deleted event"', async () => {
    eventChangeFindMany.mockResolvedValue([
      changeRow({ changeType: 'DELETED' }),
    ]);

    const result = await getMemberChanges(1, mockPrisma);
    expect(result[0].message).toMatch(/deleted event/);
  });

  it('maps MEMBER_ADDED to "added a member to event"', async () => {
    eventChangeFindMany.mockResolvedValue([
      changeRow({ changeType: 'MEMBER_ADDED' }),
    ]);

    const result = await getMemberChanges(1, mockPrisma);
    expect(result[0].message).toMatch(/added a member to event/);
  });

  it('maps MEMBER_REMOVED to "removed a member from event"', async () => {
    eventChangeFindMany.mockResolvedValue([
      changeRow({ changeType: 'MEMBER_REMOVED' }),
    ]);

    const result = await getMemberChanges(1, mockPrisma);
    expect(result[0].message).toMatch(/removed a member from event/);
  });

  it('maps TOOL_ASSIGNED to "assigned a tool to event"', async () => {
    eventChangeFindMany.mockResolvedValue([
      changeRow({ changeType: 'TOOL_ASSIGNED' }),
    ]);

    const result = await getMemberChanges(1, mockPrisma);
    expect(result[0].message).toMatch(/assigned a tool to event/);
  });

  it('maps TOOL_RETURNED to "returned a tool from event"', async () => {
    eventChangeFindMany.mockResolvedValue([
      changeRow({ changeType: 'TOOL_RETURNED' }),
    ]);

    const result = await getMemberChanges(1, mockPrisma);
    expect(result[0].message).toMatch(/returned a tool from event/);
  });

  it('defaults unknown changeType to "changed event"', async () => {
    eventChangeFindMany.mockResolvedValue([
      changeRow({ changeType: 'UNKNOWN_ACTION' }),
    ]);

    const result = await getMemberChanges(1, mockPrisma);
    expect(result[0].message).toMatch(/changed event/);
  });
});

describe('getMemberChanges — event title fallbacks', () => {
  it('prefers live event.title when available', async () => {
    eventChangeFindMany.mockResolvedValue([
      changeRow({
        event: { id: 10, title: 'Live Title' },
        eventTitleSnapshot: 'Old Title',
      }),
    ]);

    const result = await getMemberChanges(1, mockPrisma);
    expect(result[0].eventTitle).toBe('Live Title');
  });

  it('falls back to eventTitleSnapshot when event is null (after SetNull cascade)', async () => {
    eventChangeFindMany.mockResolvedValue([
      changeRow({
        event: null, // SetNull after event deletion
        eventTitleSnapshot: 'Deleted Event Title',
      }),
    ]);

    const result = await getMemberChanges(1, mockPrisma);
    expect(result[0].eventTitle).toBe('Deleted Event Title');
  });

  it('falls back to "(deleted event)" when both title and snapshot are null', async () => {
    eventChangeFindMany.mockResolvedValue([
      changeRow({
        event: null,
        eventTitleSnapshot: null,
      }),
    ]);

    const result = await getMemberChanges(1, mockPrisma);
    expect(result[0].eventTitle).toBe('(deleted event)');
  });

  it('sets eventId to null when event is null', async () => {
    eventChangeFindMany.mockResolvedValue([
      changeRow({
        event: null,
      }),
    ]);

    const result = await getMemberChanges(1, mockPrisma);
    expect(result[0].eventId).toBeNull();
  });

  it('preserves eventId when event exists', async () => {
    eventChangeFindMany.mockResolvedValue([
      changeRow({
        event: { id: 42, title: 'Some Event' },
      }),
    ]);

    const result = await getMemberChanges(1, mockPrisma);
    expect(result[0].eventId).toBe(42);
  });
});

describe('getMemberChanges — member name fallback', () => {
  it('uses member.name when available', async () => {
    eventChangeFindMany.mockResolvedValue([
      changeRow({ member: { id: 1, name: 'Jakub' } }),
    ]);

    const result = await getMemberChanges(1, mockPrisma);
    expect(result[0].memberName).toBe('Jakub');
    expect(result[0].message).toMatch(/^Jakub /);
  });

  it('defaults to "Unknown member" when member.name is null', async () => {
    eventChangeFindMany.mockResolvedValue([
      changeRow({ member: { id: 1, name: null } }),
    ]);

    const result = await getMemberChanges(1, mockPrisma);
    expect(result[0].memberName).toBeNull();
    expect(result[0].message).toMatch(/^Unknown member /);
  });
});
