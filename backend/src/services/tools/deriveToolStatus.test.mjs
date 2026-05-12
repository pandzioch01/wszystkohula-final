import { describe, it, expect } from 'vitest';
import pkg from './deriveToolStatus.js';
const { deriveToolStatus } = pkg;

// Pure function — no Prisma involved. Just exercise every branch of the
// priority cascade.
describe('deriveToolStatus', () => {
  const now = new Date('2026-05-15T12:00:00Z');

  it('returns BORROWED when borrowedById is set, ignoring stored status', () => {
    const tool = { status: 'IN_STORAGE', borrowedById: 1, eventUsages: [] };
    expect(deriveToolStatus(tool, now)).toBe('BORROWED');
  });

  it('keeps AT_EVENT when at least one assignment is currently running', () => {
    const tool = {
      status: 'AT_EVENT',
      borrowedById: null,
      eventUsages: [
        { event: { startDate: '2026-05-14T00:00:00Z', endDate: '2026-05-16T23:59:59Z' } },
      ],
    };
    expect(deriveToolStatus(tool, now)).toBe('AT_EVENT');
  });

  it('downgrades AT_EVENT to IN_STORAGE when no event is running', () => {
    const tool = {
      status: 'AT_EVENT',
      borrowedById: null,
      eventUsages: [
        { event: { startDate: '2026-05-01T00:00:00Z', endDate: '2026-05-02T00:00:00Z' } },
      ],
    };
    expect(deriveToolStatus(tool, now)).toBe('IN_STORAGE');
  });

  it('downgrades AT_EVENT when only future events are assigned', () => {
    const tool = {
      status: 'AT_EVENT',
      borrowedById: null,
      eventUsages: [
        { event: { startDate: '2026-06-01T00:00:00Z', endDate: '2026-06-02T00:00:00Z' } },
      ],
    };
    expect(deriveToolStatus(tool, now)).toBe('IN_STORAGE');
  });

  it.each(['IN_STORAGE', 'MAINTENANCE', 'LOST'])(
    'keeps stored status %s as-is',
    (status) => {
      const tool = { status, borrowedById: null, eventUsages: [] };
      expect(deriveToolStatus(tool, now)).toBe(status);
    },
  );
});
