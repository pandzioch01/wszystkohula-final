import { describe, it, expect } from 'vitest';
import { deriveToolStatus } from './deriveToolStatus.js';

// Helper to build a tool object with sensible defaults.
function tool(overrides = {}) {
  return {
    status: 'IN_STORAGE',
    borrowedById: null,
    eventUsages: [],
    ...overrides,
  };
}

// Helper to build an event usage with a running/future/past event.
function eventUsage(overrides = {}) {
  return {
    event: {
      startDate: new Date('2026-05-10T10:00:00Z'),
      endDate: new Date('2026-05-10T20:00:00Z'),
      ...overrides?.event,
    },
    ...overrides,
  };
}

describe('deriveToolStatus — Rule 1: AT_EVENT + running event', () => {
  it('returns AT_EVENT when stored status is AT_EVENT and an event is currently running', () => {
    const now = new Date('2026-05-10T15:00:00Z'); // mid-event
    const t = tool({
      status: 'AT_EVENT',
      eventUsages: [
        eventUsage({
          event: {
            startDate: new Date('2026-05-10T10:00:00Z'),
            endDate: new Date('2026-05-10T20:00:00Z'),
          },
        }),
      ],
    });

    const result = deriveToolStatus(t, now);
    expect(result).toBe('AT_EVENT');
  });

  it('includes an event starting exactly now as running', () => {
    const now = new Date('2026-05-10T10:00:00Z'); // event.startDate === now
    const t = tool({
      status: 'AT_EVENT',
      eventUsages: [
        eventUsage({
          event: {
            startDate: new Date('2026-05-10T10:00:00Z'),
            endDate: new Date('2026-05-10T20:00:00Z'),
          },
        }),
      ],
    });

    const result = deriveToolStatus(t, now);
    expect(result).toBe('AT_EVENT');
  });

  it('includes an event ending exactly now as running', () => {
    const now = new Date('2026-05-10T20:00:00Z'); // event.endDate === now
    const t = tool({
      status: 'AT_EVENT',
      eventUsages: [
        eventUsage({
          event: {
            startDate: new Date('2026-05-10T10:00:00Z'),
            endDate: new Date('2026-05-10T20:00:00Z'),
          },
        }),
      ],
    });

    const result = deriveToolStatus(t, now);
    expect(result).toBe('AT_EVENT');
  });

  it('takes precedence over a borrower (borrowed tool sent to event)', () => {
    const now = new Date('2026-05-10T15:00:00Z');
    const t = tool({
      status: 'AT_EVENT',
      borrowedById: 42, // someone had it, but it's at the event
      eventUsages: [
        eventUsage({
          event: {
            startDate: new Date('2026-05-10T10:00:00Z'),
            endDate: new Date('2026-05-10T20:00:00Z'),
          },
        }),
      ],
    });

    const result = deriveToolStatus(t, now);
    expect(result).toBe('AT_EVENT');
  });

  it('requires at least one event to be running (multiple eventUsages)', () => {
    const now = new Date('2026-05-10T15:00:00Z');
    const t = tool({
      status: 'AT_EVENT',
      eventUsages: [
        eventUsage({
          event: {
            startDate: new Date('2026-05-09T10:00:00Z'), // past
            endDate: new Date('2026-05-09T20:00:00Z'),
          },
        }),
        eventUsage({
          event: {
            startDate: new Date('2026-05-10T10:00:00Z'), // current
            endDate: new Date('2026-05-10T20:00:00Z'),
          },
        }),
      ],
    });

    const result = deriveToolStatus(t, now);
    expect(result).toBe('AT_EVENT');
  });
});

describe('deriveToolStatus — Rule 2: borrowedById set', () => {
  it('returns BORROWED when borrowedById is set', () => {
    const t = tool({ status: 'IN_STORAGE', borrowedById: 42 });

    expect(deriveToolStatus(t)).toBe('BORROWED');
  });

  it('returns BORROWED for any non-null/undefined borrowedById value', () => {
    [1, 0, 42, 999].forEach((id) => {
      const t = tool({ status: 'IN_STORAGE', borrowedById: id });
      expect(deriveToolStatus(t)).toBe('BORROWED');
    });
  });

  it('is skipped when borrowedById is null', () => {
    const t = tool({
      status: 'IN_STORAGE',
      borrowedById: null,
      eventUsages: [],
    });

    // Should return IN_STORAGE (Rule 4), not BORROWED
    expect(deriveToolStatus(t)).toBe('IN_STORAGE');
  });

  it('is skipped when borrowedById is undefined', () => {
    const t = tool({
      status: 'IN_STORAGE',
      borrowedById: undefined,
      eventUsages: [],
    });

    // Should return IN_STORAGE (Rule 4), not BORROWED
    expect(deriveToolStatus(t)).toBe('IN_STORAGE');
  });
});

describe('deriveToolStatus — Rule 3: AT_EVENT fallback to IN_STORAGE', () => {
  it('downgrades AT_EVENT to IN_STORAGE when no event is running and no borrower', () => {
    const now = new Date('2026-05-11T00:00:00Z'); // after event
    const t = tool({
      status: 'AT_EVENT',
      borrowedById: null,
      eventUsages: [
        eventUsage({
          event: {
            startDate: new Date('2026-05-10T10:00:00Z'),
            endDate: new Date('2026-05-10T20:00:00Z'),
          },
        }),
      ],
    });

    const result = deriveToolStatus(t, now);
    expect(result).toBe('IN_STORAGE');
  });

  it('is skipped when eventUsages is empty', () => {
    const t = tool({
      status: 'AT_EVENT',
      borrowedById: null,
      eventUsages: [],
    });

    const result = deriveToolStatus(t);
    expect(result).toBe('IN_STORAGE');
  });

  it('is skipped when eventUsages is null', () => {
    const t = tool({
      status: 'AT_EVENT',
      borrowedById: null,
      eventUsages: null,
    });

    const result = deriveToolStatus(t);
    expect(result).toBe('IN_STORAGE');
  });

  it('is skipped when eventUsages is undefined', () => {
    const t = tool({
      status: 'AT_EVENT',
      borrowedById: null,
    });
    delete t.eventUsages;

    const result = deriveToolStatus(t);
    expect(result).toBe('IN_STORAGE');
  });
});

describe('deriveToolStatus — Rule 4: preserve other statuses', () => {
  it('keeps IN_STORAGE unchanged', () => {
    const t = tool({ status: 'IN_STORAGE', borrowedById: null });

    expect(deriveToolStatus(t)).toBe('IN_STORAGE');
  });

  it('keeps MAINTENANCE when not borrowed and not AT_EVENT', () => {
    const t = tool({
      status: 'MAINTENANCE',
      borrowedById: null,
      eventUsages: [],
    });

    expect(deriveToolStatus(t)).toBe('MAINTENANCE');
  });

  it('keeps LOST when not borrowed and not AT_EVENT', () => {
    const t = tool({
      status: 'LOST',
      borrowedById: null,
      eventUsages: [],
    });

    expect(deriveToolStatus(t)).toBe('LOST');
  });

  it('returns BORROWED when MAINTENANCE status but tool is borrowed (Rule 2 applies globally)', () => {
    const t = tool({
      status: 'MAINTENANCE',
      borrowedById: 42,
    });

    expect(deriveToolStatus(t)).toBe('BORROWED');
  });

  it('returns BORROWED when LOST status but tool is borrowed (Rule 2 applies globally)', () => {
    const t = tool({
      status: 'LOST',
      borrowedById: 42,
    });

    expect(deriveToolStatus(t)).toBe('BORROWED');
  });
});

describe('deriveToolStatus — precedence & interaction', () => {
  it('applies Rule 1 (AT_EVENT running) before Rule 2 (BORROWED)', () => {
    const now = new Date('2026-05-10T15:00:00Z');
    const t = tool({
      status: 'AT_EVENT',
      borrowedById: 42,
      eventUsages: [
        eventUsage({
          event: {
            startDate: new Date('2026-05-10T10:00:00Z'),
            endDate: new Date('2026-05-10T20:00:00Z'),
          },
        }),
      ],
    });

    expect(deriveToolStatus(t, now)).toBe('AT_EVENT');
  });

  it('applies Rule 2 (BORROWED) before Rule 3 (AT_EVENT fallback)', () => {
    const now = new Date('2026-05-11T00:00:00Z'); // event ended
    const t = tool({
      status: 'AT_EVENT',
      borrowedById: 42,
      eventUsages: [
        eventUsage({
          event: {
            startDate: new Date('2026-05-10T10:00:00Z'),
            endDate: new Date('2026-05-10T20:00:00Z'),
          },
        }),
      ],
    });

    expect(deriveToolStatus(t, now)).toBe('BORROWED');
  });

  it('applies Rule 3 (AT_EVENT fallback) before Rule 4 (preserve)', () => {
    const now = new Date('2026-05-11T00:00:00Z');
    const t = tool({
      status: 'AT_EVENT',
      borrowedById: null,
      eventUsages: [
        eventUsage({
          event: {
            startDate: new Date('2026-05-10T10:00:00Z'),
            endDate: new Date('2026-05-10T20:00:00Z'),
          },
        }),
      ],
    });

    expect(deriveToolStatus(t, now)).toBe('IN_STORAGE');
  });
});

describe('deriveToolStatus — edge cases & time boundaries', () => {
  it('correctly parses event dates as Date objects (even if strings in shape)', () => {
    const now = new Date('2026-05-10T15:00:00Z');
    const t = tool({
      status: 'AT_EVENT',
      eventUsages: [
        {
          event: {
            startDate: '2026-05-10T10:00:00Z', // string, not Date
            endDate: '2026-05-10T20:00:00Z',
          },
        },
      ],
    });

    // Should coerce to Date and work correctly
    const result = deriveToolStatus(t, now);
    expect(result).toBe('AT_EVENT');
  });

  it('defaults `now` to current time if not provided', () => {
    const t = tool({
      status: 'IN_STORAGE',
      borrowedById: null,
      eventUsages: [],
    });

    // Call without `now` — should not throw
    const result = deriveToolStatus(t);
    expect(result).toBe('IN_STORAGE');
  });

  it('handles an event that started before now but ends after now', () => {
    const now = new Date('2026-05-10T15:00:00Z');
    const t = tool({
      status: 'AT_EVENT',
      eventUsages: [
        eventUsage({
          event: {
            startDate: new Date('2026-05-10T10:00:00Z'),
            endDate: new Date('2026-05-10T20:00:00Z'),
          },
        }),
      ],
    });

    expect(deriveToolStatus(t, now)).toBe('AT_EVENT');
  });

  it('handles an event ending one second after now', () => {
    const now = new Date('2026-05-10T19:59:59Z');
    const t = tool({
      status: 'AT_EVENT',
      eventUsages: [
        eventUsage({
          event: {
            startDate: new Date('2026-05-10T10:00:00Z'),
            endDate: new Date('2026-05-10T20:00:00Z'),
          },
        }),
      ],
    });

    expect(deriveToolStatus(t, now)).toBe('AT_EVENT');
  });

  it('excludes an event that ended one second before now', () => {
    const now = new Date('2026-05-10T20:00:01Z');
    const t = tool({
      status: 'AT_EVENT',
      eventUsages: [
        eventUsage({
          event: {
            startDate: new Date('2026-05-10T10:00:00Z'),
            endDate: new Date('2026-05-10T20:00:00Z'),
          },
        }),
      ],
    });

    expect(deriveToolStatus(t, now)).toBe('IN_STORAGE');
  });

  it('excludes an event that starts one second after now', () => {
    const now = new Date('2026-05-10T09:59:59Z');
    const t = tool({
      status: 'AT_EVENT',
      eventUsages: [
        eventUsage({
          event: {
            startDate: new Date('2026-05-10T10:00:00Z'),
            endDate: new Date('2026-05-10T20:00:00Z'),
          },
        }),
      ],
    });

    expect(deriveToolStatus(t, now)).toBe('IN_STORAGE');
  });
});
