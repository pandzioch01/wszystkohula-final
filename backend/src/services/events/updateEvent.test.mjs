import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateEvent } from './updateEvent.js';

// Hand-rolled mock satisfying the four prisma surfaces updateEvent touches:
// event.update, eventTool.deleteMany, eventTool.createMany, eventChange.create.
// Passed in as the optional 4th arg — no vi.mock, no DB.
const eventUpdate = vi.fn();
const eventToolDeleteMany = vi.fn();
const eventToolCreateMany = vi.fn();
const eventChangeCreate = vi.fn();

const mockPrisma = {
  event: { update: eventUpdate },
  eventTool: { deleteMany: eventToolDeleteMany, createMany: eventToolCreateMany },
  eventChange: { create: eventChangeCreate },
};

beforeEach(() => {
  eventUpdate.mockReset();
  eventToolDeleteMany.mockReset();
  eventToolCreateMany.mockReset();
  eventChangeCreate.mockReset();

  // Sensible defaults — individual tests override .mockResolvedValueOnce as needed.
  eventUpdate.mockResolvedValue({
    id: 1,
    title: 'Updated title',
    description: null,
    clientName: null,
    firmsNames: [],
    startDate: new Date('2026-05-13T18:00:00Z'),
    endDate: new Date('2026-05-14T02:00:00Z'),
  });
  eventToolDeleteMany.mockResolvedValue({ count: 0 });
  eventToolCreateMany.mockResolvedValue({ count: 0 });
  eventChangeCreate.mockResolvedValue({});
});

describe('updateEvent — partial update (PATCH semantics)', () => {
  it('includes only the fields explicitly provided in the data payload', async () => {
    await updateEvent(1, { title: 'New', startDate: new Date('2026-06-01') }, undefined, mockPrisma);

    expect(eventUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: { title: 'New', startDate: new Date('2026-06-01') },
      }),
    );
  });

  it('omits keys the caller did not pass (no implicit overwrites)', async () => {
    await updateEvent(1, { title: 'Only title' }, undefined, mockPrisma);

    const callArgs = eventUpdate.mock.calls[0][0];
    expect(callArgs.data).toEqual({ title: 'Only title' });
    expect(callArgs.data).not.toHaveProperty('description');
    expect(callArgs.data).not.toHaveProperty('endDate');
  });

  it('keeps explicit null/empty values (undefined is the only sentinel that skips)', async () => {
    await updateEvent(
      1,
      { description: null, clientName: '', firmsNames: [] },
      undefined,
      mockPrisma,
    );

    expect(eventUpdate.mock.calls[0][0].data).toEqual({
      description: null,
      clientName: '',
      firmsNames: [],
    });
  });

  it('sends an empty data object when no updatable fields are provided', async () => {
    await updateEvent(1, {}, undefined, mockPrisma);

    expect(eventUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: {} }),
    );
  });

  it('selects exactly the public event fields', async () => {
    await updateEvent(1, { title: 'x' }, undefined, mockPrisma);

    expect(eventUpdate).toHaveBeenCalledWith(
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

  it('returns the row from prisma.event.update unchanged', async () => {
    const row = {
      id: 7,
      title: 'X',
      description: 'd',
      clientName: 'c',
      firmsNames: ['a'],
      startDate: new Date(),
      endDate: new Date(),
    };
    eventUpdate.mockResolvedValueOnce(row);

    const result = await updateEvent(7, { title: 'X' }, undefined, mockPrisma);
    expect(result).toBe(row);
  });
});

describe('updateEvent — tool assignments', () => {
  it('does nothing with eventTool tables when toolIds is omitted', async () => {
    await updateEvent(1, { title: 'No tools touched' }, undefined, mockPrisma);

    expect(eventToolDeleteMany).not.toHaveBeenCalled();
    expect(eventToolCreateMany).not.toHaveBeenCalled();
  });

  it('replaces only unreturned assignments (returnedAt: null) when toolIds is provided', async () => {
    await updateEvent(1, { toolIds: [10, 20] }, undefined, mockPrisma);

    expect(eventToolDeleteMany).toHaveBeenCalledWith({
      where: { eventId: 1, returnedAt: null },
    });
  });

  it('creates new EventTool rows for each toolId', async () => {
    await updateEvent(1, { toolIds: [10, 20, 30] }, undefined, mockPrisma);

    expect(eventToolCreateMany).toHaveBeenCalledWith({
      data: [
        { eventId: 1, toolId: 10 },
        { eventId: 1, toolId: 20 },
        { eventId: 1, toolId: 30 },
      ],
    });
  });

  it('clears assignments but skips createMany when toolIds is an empty array', async () => {
    await updateEvent(1, { toolIds: [] }, undefined, mockPrisma);

    expect(eventToolDeleteMany).toHaveBeenCalledTimes(1);
    expect(eventToolCreateMany).not.toHaveBeenCalled();
  });

  it('runs the delete before the create (history-then-rewrite order)', async () => {
    const order = [];
    eventToolDeleteMany.mockImplementationOnce(async () => {
      order.push('delete');
      return { count: 1 };
    });
    eventToolCreateMany.mockImplementationOnce(async () => {
      order.push('create');
      return { count: 2 };
    });

    await updateEvent(1, { toolIds: [10, 20] }, undefined, mockPrisma);

    expect(order).toEqual(['delete', 'create']);
  });
});

describe('updateEvent — audit log', () => {
  it('does not write an EventChange row when actorMemberId is undefined', async () => {
    await updateEvent(1, { title: 'x' }, undefined, mockPrisma);

    expect(eventChangeCreate).not.toHaveBeenCalled();
  });

  it('writes an UPDATED audit row with the field list when actorMemberId is provided', async () => {
    eventUpdate.mockResolvedValueOnce({
      id: 1,
      title: 'Updated title',
      description: null,
      clientName: null,
      firmsNames: [],
      startDate: new Date(),
      endDate: new Date(),
    });

    await updateEvent(1, { title: 'Updated title', description: 'new' }, 42, mockPrisma);

    expect(eventChangeCreate).toHaveBeenCalledWith({
      data: {
        eventId: 1,
        eventTitleSnapshot: 'Updated title',
        memberId: 42,
        changeType: 'UPDATED',
        description: 'Updated event "Updated title" (title, description)',
      },
    });
  });

  it('lists no fields in the audit description when the data payload is empty', async () => {
    await updateEvent(1, {}, 42, mockPrisma);

    expect(eventChangeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: expect.stringMatching(/\(\)$/),
        }),
      }),
    );
  });

  it('does not include toolIds in the audited field list (only event-row fields)', async () => {
    await updateEvent(1, { title: 'x', toolIds: [10] }, 42, mockPrisma);

    const auditCall = eventChangeCreate.mock.calls[0][0];
    expect(auditCall.data.description).toBe('Updated event "Updated title" (title)');
    expect(auditCall.data.description).not.toMatch(/toolIds/);
  });

  it('swallows audit-write failures and still returns the updated event', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    eventChangeCreate.mockRejectedValueOnce(new Error('audit table unavailable'));

    const result = await updateEvent(1, { title: 'x' }, 42, mockPrisma);

    expect(result).toMatchObject({ id: 1, title: 'Updated title' });
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to write UPDATED audit:',
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });
});
