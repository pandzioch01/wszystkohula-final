import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteEvent } from './deleteEvent.js';

// Hand-rolled mocks for the two Prisma surfaces deleteEvent touches:
// event.delete and eventChange.create. Passed as the optional 3rd arg.
const eventDelete = vi.fn();
const eventChangeCreate = vi.fn();

const mockPrisma = {
  event: { delete: eventDelete },
  eventChange: { create: eventChangeCreate },
};

beforeEach(() => {
  eventDelete.mockReset();
  eventChangeCreate.mockReset();

  // Sensible default — tests override as needed.
  eventDelete.mockResolvedValue({
    id: 1,
    title: 'Sample event',
  });
  eventChangeCreate.mockResolvedValue({});
});

describe('deleteEvent — deletion', () => {
  it('calls prisma.event.delete with the event id', async () => {
    await deleteEvent(42, undefined, mockPrisma);

    expect(eventDelete).toHaveBeenCalledWith({
      where: { id: 42 },
      select: { id: true, title: true },
    });
  });

  it('selects only id and title from the deleted row', async () => {
    await deleteEvent(1, undefined, mockPrisma);

    expect(eventDelete).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { id: true, title: true },
      }),
    );
  });

  it('does not return anything', async () => {
    const result = await deleteEvent(1, undefined, mockPrisma);

    expect(result).toBeUndefined();
  });

  it('deletes the event even when actorMemberId is not provided', async () => {
    await deleteEvent(99, undefined, mockPrisma);

    expect(eventDelete).toHaveBeenCalledTimes(1);
    expect(eventDelete).toHaveBeenCalledWith({
      where: { id: 99 },
      select: { id: true, title: true },
    });
  });
});

describe('deleteEvent — audit log', () => {
  it('does not write an EventChange row when actorMemberId is undefined', async () => {
    await deleteEvent(1, undefined, mockPrisma);

    expect(eventChangeCreate).not.toHaveBeenCalled();
  });

  it('writes a DELETED audit row when actorMemberId is provided', async () => {
    eventDelete.mockResolvedValueOnce({
      id: 7,
      title: 'Conference 2026',
    });

    await deleteEvent(7, 42, mockPrisma);

    expect(eventChangeCreate).toHaveBeenCalledWith({
      data: {
        eventId: null,
        eventTitleSnapshot: 'Conference 2026',
        memberId: 42,
        changeType: 'DELETED',
        description: 'Deleted event "Conference 2026"',
      },
    });
  });

  it('captures the deleted event title for the audit snapshot', async () => {
    eventDelete.mockResolvedValueOnce({
      id: 5,
      title: 'Original event name',
    });

    await deleteEvent(5, 10, mockPrisma);

    expect(eventChangeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventTitleSnapshot: 'Original event name',
        }),
      }),
    );
  });

  it('sets eventId to null in the audit (event is gone)', async () => {
    await deleteEvent(1, 42, mockPrisma);

    expect(eventChangeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventId: null,
        }),
      }),
    );
  });

  it('swallows audit-write failures', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    eventChangeCreate.mockRejectedValueOnce(new Error('audit table unavailable'));

    await deleteEvent(1, 42, mockPrisma);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to write DELETED audit:',
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });
});
