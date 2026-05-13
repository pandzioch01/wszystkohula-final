import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEventDetails } from './getEventDetails.js';

// Plain object that satisfies the shape `getEventDetails` accesses on the
// prisma client (just `event.findUnique`). We pass this directly as the
// second argument, so the service uses our mock instead of the real client.
// No vi.mock, no module hooks, no database connection.
const findUniqueMock = vi.fn();
const mockPrisma = {
  event: { findUnique: findUniqueMock },
};

beforeEach(() => {
  findUniqueMock.mockReset();
});

// Build a Prisma-shaped event row that the service would receive from a real
// query. Tests override pieces of this via the spread.
function fakeEventRow(overrides = {}) {
  return {
    id: 1,
    title: 'Festiwal Wrocław Beats',
    description: 'Three-day festival',
    clientName: 'Stowarzyszenie',
    firmsNames: ['SoundMaster'],
    startDate: new Date('2026-05-13T18:00:00Z'),
    endDate: new Date('2026-05-16T02:00:00Z'),
    participants: [],
    usedTools: [],
    ...overrides,
  };
}

describe('getEventDetails — basic shape', () => {
  it('returns null when the event does not exist', async () => {
    findUniqueMock.mockResolvedValue(null);

    expect(await getEventDetails(999, mockPrisma)).toBeNull();
    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 999 } }),
    );
  });

  it('flattens participants and tools into the response shape', async () => {
    findUniqueMock.mockResolvedValue(
      fakeEventRow({
        participants: [
          { member: { id: 1, name: 'Magdalena Pawlak' } },
          { member: { id: 2, name: 'Jakub Wójcik' } },
        ],
        usedTools: [
          {
            assignedAt: new Date('2026-05-12T08:00:00Z'),
            returnedAt: null,
            tool: {
              id: 10,
              name: 'Subwoofer JBL',
              status: 'IN_STORAGE',
              borrowedById: null,
              eventUsages: [],
            },
          },
        ],
      }),
    );

    const result = await getEventDetails(1, mockPrisma);

    expect(result.participants).toEqual([
      { id: 1, name: 'Magdalena Pawlak' },
      { id: 2, name: 'Jakub Wójcik' },
    ]);
    expect(result.tools).toHaveLength(1);
    expect(result.tools[0]).toMatchObject({
      id: 10,
      name: 'Subwoofer JBL',
      status: 'IN_STORAGE',
      assignedAt: expect.any(Date),
      returnedAt: null,
    });
  });

  it('returns empty arrays when an event has no participants or tools', async () => {
    findUniqueMock.mockResolvedValue(fakeEventRow());

    const result = await getEventDetails(1, mockPrisma);
    expect(result.participants).toEqual([]);
    expect(result.tools).toEqual([]);
  });
});

// Each test exercises one branch of deriveToolStatus by setting up a tool
// with specific borrowedById / eventUsages / stored status, then asserting
// the *derived* status the service returns.
describe('getEventDetails — derived tool status', () => {
  function toolRow(toolOverrides) {
    return {
      assignedAt: new Date(),
      returnedAt: null,
      tool: {
        id: 10,
        name: 'Test tool',
        status: 'IN_STORAGE',
        borrowedById: null,
        eventUsages: [],
        ...toolOverrides,
      },
    };
  }

  it('shows AT_EVENT when at least one assigned event is currently running', async () => {
    const now = new Date();
    findUniqueMock.mockResolvedValue(
      fakeEventRow({
        usedTools: [
          toolRow({
            status: 'AT_EVENT',
            eventUsages: [
              {
                event: {
                  startDate: new Date(now.getTime() - 86400000),
                  endDate: new Date(now.getTime() + 86400000),
                },
              },
            ],
          }),
        ],
      }),
    );

    const result = await getEventDetails(1, mockPrisma);
    expect(result.tools[0].status).toBe('AT_EVENT');
  });

  it('shows BORROWED when borrowedById is set and no event is currently running', async () => {
    findUniqueMock.mockResolvedValue(
      fakeEventRow({
        usedTools: [
          toolRow({
            status: 'AT_EVENT', // stored value can lie; derive overrides
            borrowedById: 3,
            eventUsages: [],
          }),
        ],
      }),
    );

    const result = await getEventDetails(1, mockPrisma);
    expect(result.tools[0].status).toBe('BORROWED');
  });

  it('downgrades AT_EVENT to IN_STORAGE when no running event and no borrower', async () => {
    findUniqueMock.mockResolvedValue(
      fakeEventRow({
        usedTools: [
          toolRow({
            status: 'AT_EVENT',
            borrowedById: null,
            eventUsages: [],
          }),
        ],
      }),
    );

    const result = await getEventDetails(1, mockPrisma);
    expect(result.tools[0].status).toBe('IN_STORAGE');
  });

  it('keeps stored MAINTENANCE / LOST regardless of event assignments', async () => {
    findUniqueMock.mockResolvedValue(
      fakeEventRow({
        usedTools: [
          toolRow({ id: 12, name: 'Wózek', status: 'MAINTENANCE' }),
          toolRow({ id: 13, name: 'Walizka', status: 'LOST' }),
        ],
      }),
    );

    const result = await getEventDetails(1, mockPrisma);
    expect(result.tools[0].status).toBe('MAINTENANCE');
    expect(result.tools[1].status).toBe('LOST');
  });
});
