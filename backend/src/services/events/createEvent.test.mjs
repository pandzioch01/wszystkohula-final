import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEvent } from './createEvent.js';

// Hand-rolled mocks for the two Prisma surfaces createEvent touches:
// event.create and eventChange.create. Passed as the optional 3rd arg.
const eventCreate = vi.fn();
const eventChangeCreate = vi.fn();

const mockPrisma = {
  event: { create: eventCreate },
  eventChange: { create: eventChangeCreate },
};

beforeEach(() => {
  eventCreate.mockReset();
  eventChangeCreate.mockReset();

  // Sensible default — tests override as needed.
  eventCreate.mockResolvedValue({
    id: 1,
    title: 'Sample event',
    description: null,
    clientName: null,
    firmsNames: [],
    startDate: new Date('2026-05-13T18:00:00Z'),
    endDate: new Date('2026-05-14T02:00:00Z'),
  });
  eventChangeCreate.mockResolvedValue({});
});

describe('createEvent — event data & defaults', () => {
  it('passes required fields to prisma.event.create', async () => {
    const start = new Date('2026-05-13');
    const end = new Date('2026-05-14');

    await createEvent(
      {
        title: 'My event',
        startDate: start,
        endDate: end,
      },
      undefined,
      mockPrisma,
    );

    expect(eventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'My event',
          startDate: start,
          endDate: end,
        }),
      }),
    );
  });

  it('defaults description to null when not provided', async () => {
    await createEvent(
      {
        title: 'x',
        startDate: new Date(),
        endDate: new Date(),
      },
      undefined,
      mockPrisma,
    );

    expect(eventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ description: null }),
      }),
    );
  });

  it('defaults clientName to null when not provided', async () => {
    await createEvent(
      {
        title: 'x',
        startDate: new Date(),
        endDate: new Date(),
      },
      undefined,
      mockPrisma,
    );

    expect(eventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ clientName: null }),
      }),
    );
  });

  it('defaults firmsNames to an empty array when not provided', async () => {
    await createEvent(
      {
        title: 'x',
        startDate: new Date(),
        endDate: new Date(),
      },
      undefined,
      mockPrisma,
    );

    expect(eventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ firmsNames: [] }),
      }),
    );
  });

  it('preserves explicit values (null, empty string, etc.)', async () => {
    await createEvent(
      {
        title: 'x',
        description: 'explicit desc',
        clientName: 'explicit client',
        firmsNames: ['A', 'B'],
        startDate: new Date(),
        endDate: new Date(),
      },
      undefined,
      mockPrisma,
    );

    expect(eventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: 'explicit desc',
          clientName: 'explicit client',
          firmsNames: ['A', 'B'],
        }),
      }),
    );
  });

  it('selects exactly the public event fields', async () => {
    await createEvent(
      {
        title: 'x',
        startDate: new Date(),
        endDate: new Date(),
      },
      undefined,
      mockPrisma,
    );

    expect(eventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          id: true,
          title: true,
          description: true,
          clientName: true,
          firmsNames: true,
          startDate: true,
          endDate: true,
        },
      }),
    );
  });

  it('returns the row from prisma.event.create unchanged', async () => {
    const row = {
      id: 42,
      title: 'Event',
      description: 'd',
      clientName: 'c',
      firmsNames: ['a'],
      startDate: new Date(),
      endDate: new Date(),
    };
    eventCreate.mockResolvedValueOnce(row);

    const result = await createEvent(
      { title: 'Event', startDate: new Date(), endDate: new Date() },
      undefined,
      mockPrisma,
    );

    expect(result).toBe(row);
  });
});

describe('createEvent — tool assignments (inline in create)', () => {
  it('does not include usedTools in the create payload when toolIds is omitted', async () => {
    await createEvent(
      {
        title: 'x',
        startDate: new Date(),
        endDate: new Date(),
      },
      undefined,
      mockPrisma,
    );

    const createPayload = eventCreate.mock.calls[0][0].data;
    expect(createPayload.usedTools).toBeUndefined();
  });

  it('does not include usedTools when toolIds is an empty array', async () => {
    await createEvent(
      {
        title: 'x',
        toolIds: [],
        startDate: new Date(),
        endDate: new Date(),
      },
      undefined,
      mockPrisma,
    );

    const createPayload = eventCreate.mock.calls[0][0].data;
    expect(createPayload.usedTools).toBeUndefined();
  });

  it('creates EventTool rows inline when toolIds has values', async () => {
    await createEvent(
      {
        title: 'x',
        toolIds: [10, 20, 30],
        startDate: new Date(),
        endDate: new Date(),
      },
      undefined,
      mockPrisma,
    );

    expect(eventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          usedTools: {
            create: [{ toolId: 10 }, { toolId: 20 }, { toolId: 30 }],
          },
        }),
      }),
    );
  });

  it('maps toolIds directly without adding other fields', async () => {
    await createEvent(
      {
        title: 'x',
        toolIds: [5],
        startDate: new Date(),
        endDate: new Date(),
      },
      undefined,
      mockPrisma,
    );

    const usedTools = eventCreate.mock.calls[0][0].data.usedTools;
    expect(usedTools.create).toEqual([{ toolId: 5 }]);
  });
});

describe('createEvent — audit log', () => {
  it('does not write an EventChange row when actorMemberId is undefined', async () => {
    await createEvent(
      {
        title: 'x',
        startDate: new Date(),
        endDate: new Date(),
      },
      undefined,
      mockPrisma,
    );

    expect(eventChangeCreate).not.toHaveBeenCalled();
  });

  it('writes a CREATED audit row when actorMemberId is provided', async () => {
    eventCreate.mockResolvedValueOnce({
      id: 99,
      title: 'Birthday party',
      description: null,
      clientName: null,
      firmsNames: [],
      startDate: new Date(),
      endDate: new Date(),
    });

    await createEvent(
      {
        title: 'Birthday party',
        startDate: new Date(),
        endDate: new Date(),
      },
      42,
      mockPrisma,
    );

    expect(eventChangeCreate).toHaveBeenCalledWith({
      data: {
        eventId: 99,
        eventTitleSnapshot: 'Birthday party',
        memberId: 42,
        changeType: 'CREATED',
        description: 'Created event "Birthday party"',
      },
    });
  });

  it('uses the event id and title from the created event, not the input data', async () => {
    eventCreate.mockResolvedValueOnce({
      id: 5,
      title: 'Persisted title',
      description: null,
      clientName: null,
      firmsNames: [],
      startDate: new Date(),
      endDate: new Date(),
    });

    await createEvent(
      {
        title: 'Input title',
        startDate: new Date(),
        endDate: new Date(),
      },
      10,
      mockPrisma,
    );

    expect(eventChangeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventId: 5,
          eventTitleSnapshot: 'Persisted title',
        }),
      }),
    );
  });

  it('swallows audit-write failures and still returns the created event', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    eventChangeCreate.mockRejectedValueOnce(new Error('audit table full'));

    const result = await createEvent(
      {
        title: 'x',
        startDate: new Date(),
        endDate: new Date(),
      },
      42,
      mockPrisma,
    );

    expect(result).toMatchObject({ id: 1, title: 'Sample event' });
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to write CREATED audit:',
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });
});
