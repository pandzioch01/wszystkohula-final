import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMemberProfile } from './getMemberProfile.js';

// Hand-rolled mocks for the three Prisma surfaces getMemberProfile touches:
// member.findUnique, eventParticipant.findFirst, tool.findMany.
// Passed as the optional 2nd arg.
const memberFindUnique = vi.fn();
const eventParticipantFindFirst = vi.fn();
const toolFindMany = vi.fn();

const mockPrisma = {
  member: { findUnique: memberFindUnique },
  eventParticipant: { findFirst: eventParticipantFindFirst },
  tool: { findMany: toolFindMany },
};

beforeEach(() => {
  memberFindUnique.mockReset();
  eventParticipantFindFirst.mockReset();
  toolFindMany.mockReset();

  // Sensible defaults — tests override as needed.
  memberFindUnique.mockResolvedValue({
    id: 1,
    name: 'Magdalena',
    city: 'Wrocław',
    specializations: ['Sound', 'Lighting'],
    ownedTools: ['Mixer', 'Speaker'],
  });
  eventParticipantFindFirst.mockResolvedValue(null);
  toolFindMany.mockResolvedValue([]);
});

describe('getMemberProfile — basic lookup', () => {
  it('queries member by id', async () => {
    await getMemberProfile(42, mockPrisma);

    expect(memberFindUnique).toHaveBeenCalledWith({
      where: { id: 42 },
      select: {
        id: true,
        name: true,
        city: true,
        specializations: true,
        ownedTools: true,
      },
    });
  });

  it('returns null when member does not exist', async () => {
    memberFindUnique.mockResolvedValueOnce(null);

    const result = await getMemberProfile(999, mockPrisma);

    expect(result).toBeNull();
  });

  it('does not query nextParticipation or borrowedTools when member is not found', async () => {
    memberFindUnique.mockResolvedValueOnce(null);

    await getMemberProfile(999, mockPrisma);

    expect(eventParticipantFindFirst).not.toHaveBeenCalled();
    expect(toolFindMany).not.toHaveBeenCalled();
  });
});

describe('getMemberProfile — next event participation', () => {
  it('queries eventParticipant with memberId and future startDate filter', async () => {
    const now = new Date();

    await getMemberProfile(1, mockPrisma);

    // Assert the where clause structure — we can't check the exact now value,
    // but we verify the query looks for future events (gt: Date).
    const callArgs = eventParticipantFindFirst.mock.calls[0][0];
    expect(callArgs.where).toMatchObject({
      memberId: 1,
      event: { startDate: { gt: expect.any(Date) } },
    });
  });

  it('orders by event.startDate ascending (nearest event first)', async () => {
    await getMemberProfile(1, mockPrisma);

    expect(eventParticipantFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { event: { startDate: 'asc' } },
      }),
    );
  });

  it('selects id, title, startDate from the event', async () => {
    await getMemberProfile(1, mockPrisma);

    expect(eventParticipantFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          event: { select: { id: true, title: true, startDate: true } },
        },
      }),
    );
  });

  it('sets nextEvent to the event when a participation exists', async () => {
    const futureDate = new Date(Date.now() + 86400000); // tomorrow
    eventParticipantFindFirst.mockResolvedValueOnce({
      event: { id: 10, title: 'Conference', startDate: futureDate },
    });

    const result = await getMemberProfile(1, mockPrisma);

    expect(result.nextEvent).toEqual({
      id: 10,
      title: 'Conference',
      startDate: futureDate,
    });
  });

  it('sets nextEvent to null when no future participation exists', async () => {
    eventParticipantFindFirst.mockResolvedValueOnce(null);

    const result = await getMemberProfile(1, mockPrisma);

    expect(result.nextEvent).toBeNull();
  });
});

describe('getMemberProfile — borrowed tools', () => {
  it('queries tools borrowed by the member', async () => {
    await getMemberProfile(1, mockPrisma);

    expect(toolFindMany).toHaveBeenCalledWith({
      where: { borrowedById: 1 },
      select: { name: true, status: true },
      orderBy: { name: 'asc' },
    });
  });

  it('orders borrowed tools alphabetically by name', async () => {
    await getMemberProfile(1, mockPrisma);

    expect(toolFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: 'asc' },
      }),
    );
  });

  it('returns an empty array when member has no borrowed tools', async () => {
    toolFindMany.mockResolvedValueOnce([]);

    const result = await getMemberProfile(1, mockPrisma);

    expect(result.borrowedTools).toEqual([]);
  });

  it('returns borrowed tools with name and status', async () => {
    toolFindMany.mockResolvedValueOnce([
      { name: 'Amplifier', status: 'BORROWED' },
      { name: 'Microphone', status: 'BORROWED' },
      { name: 'Stand', status: 'BORROWED' },
    ]);

    const result = await getMemberProfile(1, mockPrisma);

    expect(result.borrowedTools).toEqual([
      { name: 'Amplifier', status: 'BORROWED' },
      { name: 'Microphone', status: 'BORROWED' },
      { name: 'Stand', status: 'BORROWED' },
    ]);
  });

  it('preserves the order returned by Prisma (alphabetically by name)', async () => {
    toolFindMany.mockResolvedValueOnce([
      { name: 'Alpha', status: 'BORROWED' },
      { name: 'Beta', status: 'BORROWED' },
      { name: 'Gamma', status: 'BORROWED' },
    ]);

    const result = await getMemberProfile(1, mockPrisma);

    expect(result.borrowedTools.map((t) => t.name)).toEqual([
      'Alpha',
      'Beta',
      'Gamma',
    ]);
  });
});

describe('getMemberProfile — response shape', () => {
  it('flattens all member fields into the response', async () => {
    memberFindUnique.mockResolvedValueOnce({
      id: 7,
      name: 'Jakub',
      city: 'Poznań',
      specializations: ['Video'],
      ownedTools: ['Camera'],
    });
    eventParticipantFindFirst.mockResolvedValueOnce(null);
    toolFindMany.mockResolvedValueOnce([]);

    const result = await getMemberProfile(7, mockPrisma);

    expect(result).toMatchObject({
      id: 7,
      name: 'Jakub',
      city: 'Poznań',
      specializations: ['Video'],
      ownedTools: ['Camera'],
    });
  });

  it('includes borrowedTools and nextEvent in the response', async () => {
    toolFindMany.mockResolvedValueOnce([
      { name: 'Speaker', status: 'BORROWED' },
    ]);
    eventParticipantFindFirst.mockResolvedValueOnce({
      event: { id: 5, title: 'Festival', startDate: new Date() },
    });

    const result = await getMemberProfile(1, mockPrisma);

    expect(result).toHaveProperty('borrowedTools');
    expect(result).toHaveProperty('nextEvent');
    expect(result.borrowedTools).toHaveLength(1);
    expect(result.nextEvent).not.toBeNull();
  });

  it('returns the complete profile with all fields populated', async () => {
    memberFindUnique.mockResolvedValueOnce({
      id: 1,
      name: 'Test Member',
      city: 'Test City',
      specializations: ['Spec1', 'Spec2'],
      ownedTools: ['Tool1', 'Tool2'],
    });
    eventParticipantFindFirst.mockResolvedValueOnce({
      event: { id: 100, title: 'Test Event', startDate: new Date() },
    });
    toolFindMany.mockResolvedValueOnce([
      { name: 'Borrowed1', status: 'BORROWED' },
      { name: 'Borrowed2', status: 'BORROWED' },
    ]);

    const result = await getMemberProfile(1, mockPrisma);

    expect(result).toEqual({
      id: 1,
      name: 'Test Member',
      city: 'Test City',
      specializations: ['Spec1', 'Spec2'],
      ownedTools: ['Tool1', 'Tool2'],
      borrowedTools: [
        { name: 'Borrowed1', status: 'BORROWED' },
        { name: 'Borrowed2', status: 'BORROWED' },
      ],
      nextEvent: { id: 100, title: 'Test Event', startDate: expect.any(Date) },
    });
  });

  it('handles null city and empty specializations/ownedTools arrays', async () => {
    memberFindUnique.mockResolvedValueOnce({
      id: 1,
      name: 'Minimal',
      city: null,
      specializations: [],
      ownedTools: [],
    });
    eventParticipantFindFirst.mockResolvedValueOnce(null);
    toolFindMany.mockResolvedValueOnce([]);

    const result = await getMemberProfile(1, mockPrisma);

    expect(result).toMatchObject({
      name: 'Minimal',
      city: null,
      specializations: [],
      ownedTools: [],
      borrowedTools: [],
      nextEvent: null,
    });
  });
});

describe('getMemberProfile — query execution order', () => {
  it('executes all three queries independently (no await order lock)', async () => {
    const callOrder = [];

    memberFindUnique.mockImplementationOnce(async () => {
      callOrder.push('member');
      return { id: 1, name: 'X', city: null, specializations: [], ownedTools: [] };
    });
    eventParticipantFindFirst.mockImplementationOnce(async () => {
      callOrder.push('participation');
      return null;
    });
    toolFindMany.mockImplementationOnce(async () => {
      callOrder.push('tools');
      return [];
    });

    await getMemberProfile(1, mockPrisma);

    // All three should be called, but order is not guaranteed (they run in parallel).
    expect(callOrder).toHaveLength(3);
    expect(new Set(callOrder)).toEqual(new Set(['member', 'participation', 'tools']));
  });
});
