const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Truncate all tables and reset identity columns so Member id=1 etc.
  // is deterministic across re-runs (the Notifications page hardcodes id=1).
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE event_changes, event_tools, event_participants, events, tools, members RESTART IDENTITY CASCADE'
  );

  // --- Members ---
  const [anna, piotr, kasia, marek, ola, tomek] = await Promise.all([
    prisma.member.create({
      data: {
        email: 'anna.kowalska@example.com',
        name: 'Anna Kowalska',
        city: 'Poznań',
        specializations: ['Akustyka', 'Realizacja dźwięku'],
        ownedTools: ['Mikrofon Sennheiser e935', 'Słuchawki AKG K712'],
      },
    }),
    prisma.member.create({
      data: {
        email: 'piotr.nowak@example.com',
        name: 'Piotr Nowak',
        city: 'Warszawa',
        specializations: ['Oświetlenie sceniczne', 'Programowanie konsol'],
        ownedTools: ['Laptop MacBook Pro'],
      },
    }),
    prisma.member.create({
      data: {
        email: 'kasia.wisniewska@example.com',
        name: 'Kasia Wiśniewska',
        city: 'Kraków',
        specializations: ['Reżyseria', 'Scenografia'],
        ownedTools: [],
      },
    }),
    prisma.member.create({
      data: {
        email: 'marek.lewandowski@example.com',
        name: 'Marek Lewandowski',
        city: 'Wrocław',
        specializations: ['Logistyka', 'Transport sprzętu'],
        ownedTools: ['Wózek transportowy'],
      },
    }),
    prisma.member.create({
      data: {
        email: 'ola.dabrowska@example.com',
        name: 'Ola Dąbrowska',
        city: 'Gdańsk',
        specializations: ['Catering', 'Koordynacja gastronomii'],
        ownedTools: [],
      },
    }),
    prisma.member.create({
      data: {
        email: 'tomek.zielinski@example.com',
        name: 'Tomek Zieliński',
        city: 'Poznań',
        specializations: ['Wideo', 'Streaming', 'Montaż'],
        ownedTools: ['Kamera Sony FX3', 'Statyw Manfrotto'],
      },
    }),
  ]);

  // --- Tools ---
  // owner: name of the person OR company that owns the tool. null = org-owned.
  const [
    drill, ladder, projector, speaker, generator,
    tent, microphone, extensionCord, toolbox, firstAid,
  ] = await Promise.all([
    prisma.tool.create({
      data: {
        name: 'Wiertarka Bosch',
        description: 'Akumulatorowa, 18V',
        imageUrl: 'https://placehold.co/200x200?text=Wiertarka',
        owner: 'Marek Lewandowski',
        status: 'IN_STORAGE',
        location: 'Magazyn A, półka 3',
      },
    }),
    prisma.tool.create({
      data: {
        name: 'Drabina aluminiowa',
        description: '4-stopniowa, składana',
        imageUrl: 'https://placehold.co/200x200?text=Drabina',
        owner: null,
        status: 'IN_STORAGE',
        location: 'Magazyn A',
      },
    }),
    prisma.tool.create({
      data: {
        name: 'Projektor Epson',
        description: 'Full HD, 3500 lumenów',
        imageUrl: 'https://placehold.co/200x200?text=Projektor',
        owner: 'AudioPro Sp. z o.o.',
        status: 'AT_EVENT',
        location: 'Sala konferencyjna',
      },
    }),
    prisma.tool.create({
      data: {
        name: 'Głośnik JBL EON',
        description: 'Bezprzewodowy, 1000W',
        imageUrl: 'https://placehold.co/200x200?text=Glosnik',
        owner: 'Anna Kowalska',
        status: 'BORROWED',
        location: 'U Marka',
        borrowedById: marek.id,
        borrowedSince: new Date(Date.now() - 14 * 86400000),
      },
    }),
    prisma.tool.create({
      data: {
        name: 'Generator prądu Honda',
        description: '2.2 kVA, benzynowy',
        imageUrl: 'https://placehold.co/200x200?text=Generator',
        owner: 'EnergyRent Sp. z o.o.',
        status: 'IN_STORAGE',
        location: 'Magazyn B',
      },
    }),
    prisma.tool.create({
      data: {
        name: 'Namiot eventowy 5x5m',
        description: 'Biały, z bokami',
        imageUrl: 'https://placehold.co/200x200?text=Namiot',
        owner: null,
        status: 'AT_EVENT',
        location: 'Festyn miejski',
      },
    }),
    prisma.tool.create({
      data: {
        name: 'Mikrofon Shure SM58',
        description: 'Dynamiczny, przewodowy',
        imageUrl: 'https://placehold.co/200x200?text=Mikrofon',
        owner: 'Piotr Nowak',
        status: 'IN_STORAGE',
        location: 'Magazyn A',
      },
    }),
    prisma.tool.create({
      data: {
        name: 'Przedłużacz 25m',
        description: 'Bębnowy, 4 gniazda',
        imageUrl: 'https://placehold.co/200x200?text=Przedluzacz',
        owner: null,
        status: 'IN_STORAGE',
        location: 'Magazyn A',
      },
    }),
    prisma.tool.create({
      data: {
        name: 'Skrzynka narzędziowa',
        description: 'Komplet podstawowy',
        imageUrl: 'https://placehold.co/200x200?text=Skrzynka',
        owner: 'Tomek Zieliński',
        status: 'MAINTENANCE',
        location: 'Warsztat',
      },
    }),
    prisma.tool.create({
      data: {
        name: 'Apteczka pierwszej pomocy',
        description: 'Pełna, ważna do 2027',
        imageUrl: 'https://placehold.co/200x200?text=Apteczka',
        owner: 'BHP Service Sp. z o.o.',
        status: 'LOST',
        location: 'Nieznana',
      },
    }),
  ]);

  // --- Events (past, ongoing, future) ---
  const now = new Date();
  const daysAgo = (n) => new Date(now.getTime() - n * 86400000);
  const daysFromNow = (n) => new Date(now.getTime() + n * 86400000);

  const pastEvent = await prisma.event.create({
    data: {
      title: 'Festyn rodzinny w parku',
      description: 'Coroczny festyn z atrakcjami dla dzieci, muzyką i poczęstunkiem.',
      clientName: 'Urząd Miasta Poznania',
      firmsNames: ['AudioPro', 'Catering Plus'],
      startDate: daysAgo(30),
      endDate: daysAgo(29),
    },
  });

  const recentEvent = await prisma.event.create({
    data: {
      title: 'Warsztaty programowania',
      description: 'Trzydniowe warsztaty React i TypeScript.',
      clientName: 'Tech Foundation Sp. z o.o.',
      firmsNames: ['CodeAcademy', 'Drukarnia XYZ'],
      startDate: daysAgo(7),
      endDate: daysAgo(5),
    },
  });

  const ongoingEvent = await prisma.event.create({
    data: {
      title: 'Konferencja Tech Summit 2026',
      description: 'Konferencja branżowa, 3 dni prelekcji i networkingu.',
      clientName: 'Tech Summit Sp. z o.o.',
      firmsNames: ['AudioPro', 'LightWorks', 'Catering Plus'],
      startDate: daysAgo(1),
      endDate: daysFromNow(2),
    },
  });

  const upcomingEvent = await prisma.event.create({
    data: {
      title: 'Koncert charytatywny',
      description: 'Wydarzenie zbierające środki na lokalną fundację.',
      clientName: 'Fundacja Pomocna Dłoń',
      firmsNames: ['AudioPro', 'StageDesign'],
      startDate: daysFromNow(14),
      endDate: daysFromNow(14),
    },
  });

  const farFutureEvent = await prisma.event.create({
    data: {
      title: 'Piknik integracyjny',
      description: 'Coroczny piknik dla członków i ich rodzin.',
      clientName: null,
      firmsNames: [],
      startDate: daysFromNow(60),
      endDate: daysFromNow(60),
    },
  });

  // --- EventParticipants ---
  await prisma.eventParticipant.createMany({
    data: [
      { eventId: pastEvent.id, memberId: anna.id },
      { eventId: pastEvent.id, memberId: piotr.id },
      { eventId: pastEvent.id, memberId: kasia.id },

      { eventId: recentEvent.id, memberId: marek.id },
      { eventId: recentEvent.id, memberId: ola.id },
      { eventId: recentEvent.id, memberId: tomek.id },
      { eventId: recentEvent.id, memberId: anna.id },

      { eventId: ongoingEvent.id, memberId: kasia.id },
      { eventId: ongoingEvent.id, memberId: piotr.id },
      { eventId: ongoingEvent.id, memberId: ola.id },
      { eventId: ongoingEvent.id, memberId: anna.id },

      { eventId: upcomingEvent.id, memberId: tomek.id },
      { eventId: upcomingEvent.id, memberId: marek.id },
      { eventId: upcomingEvent.id, memberId: anna.id },

      { eventId: farFutureEvent.id, memberId: anna.id },
    ],
  });

  // --- EventTools ---
  await prisma.eventTool.createMany({
    data: [
      // Past — returned
      { eventId: pastEvent.id, toolId: tent.id, assignedAt: daysAgo(31), returnedAt: daysAgo(28) },
      { eventId: pastEvent.id, toolId: speaker.id, assignedAt: daysAgo(31), returnedAt: daysAgo(28) },
      { eventId: pastEvent.id, toolId: extensionCord.id, assignedAt: daysAgo(31), returnedAt: daysAgo(28) },

      // Recent — returned
      { eventId: recentEvent.id, toolId: projector.id, assignedAt: daysAgo(8), returnedAt: daysAgo(4) },
      { eventId: recentEvent.id, toolId: microphone.id, assignedAt: daysAgo(8), returnedAt: daysAgo(4) },

      // Ongoing — still out
      { eventId: ongoingEvent.id, toolId: projector.id, assignedAt: daysAgo(1), returnedAt: null },
      { eventId: ongoingEvent.id, toolId: tent.id, assignedAt: daysAgo(1), returnedAt: null },

      // Upcoming — pre-assigned
      { eventId: upcomingEvent.id, toolId: speaker.id, assignedAt: daysFromNow(13), returnedAt: null },
    ],
  });

  // --- EventChanges (audit log; member id=1 = anna gets several so notifications page has data)
  // eventTitleSnapshot is set so the title persists if the event is ever deleted.
  await prisma.eventChange.createMany({
    data: [
      { eventId: pastEvent.id, eventTitleSnapshot: pastEvent.title, memberId: anna.id, changeType: 'CREATED', timestamp: daysAgo(45), description: 'Wydarzenie utworzone' },
      { eventId: pastEvent.id, eventTitleSnapshot: pastEvent.title, memberId: anna.id, changeType: 'MEMBER_ADDED', timestamp: daysAgo(40), description: 'Dodano Piotra Nowaka' },
      { eventId: pastEvent.id, eventTitleSnapshot: pastEvent.title, memberId: anna.id, changeType: 'TOOL_ASSIGNED', timestamp: daysAgo(31), description: 'Przypisano namiot eventowy' },
      { eventId: pastEvent.id, eventTitleSnapshot: pastEvent.title, memberId: anna.id, changeType: 'TOOL_RETURNED', timestamp: daysAgo(28), description: 'Zwrócono namiot eventowy' },

      { eventId: recentEvent.id, eventTitleSnapshot: recentEvent.title, memberId: marek.id, changeType: 'CREATED', timestamp: daysAgo(20), description: 'Wydarzenie utworzone' },
      { eventId: recentEvent.id, eventTitleSnapshot: recentEvent.title, memberId: marek.id, changeType: 'UPDATED', timestamp: daysAgo(15), description: 'Zaktualizowano opis' },
      { eventId: recentEvent.id, eventTitleSnapshot: recentEvent.title, memberId: anna.id, changeType: 'TOOL_ASSIGNED', timestamp: daysAgo(8), description: 'Przypisano projektor' },

      { eventId: ongoingEvent.id, eventTitleSnapshot: ongoingEvent.title, memberId: kasia.id, changeType: 'CREATED', timestamp: daysAgo(60), description: 'Wydarzenie utworzone' },
      { eventId: ongoingEvent.id, eventTitleSnapshot: ongoingEvent.title, memberId: piotr.id, changeType: 'MEMBER_ADDED', timestamp: daysAgo(30), description: 'Dodano współorganizatora' },
      { eventId: ongoingEvent.id, eventTitleSnapshot: ongoingEvent.title, memberId: anna.id, changeType: 'TOOL_ASSIGNED', timestamp: daysAgo(1), description: 'Przypisano projektor i namiot' },
      { eventId: ongoingEvent.id, eventTitleSnapshot: ongoingEvent.title, memberId: anna.id, changeType: 'UPDATED', timestamp: daysAgo(1), description: 'Doprecyzowano harmonogram' },

      { eventId: upcomingEvent.id, eventTitleSnapshot: upcomingEvent.title, memberId: tomek.id, changeType: 'CREATED', timestamp: daysAgo(10), description: 'Wydarzenie utworzone' },
      { eventId: upcomingEvent.id, eventTitleSnapshot: upcomingEvent.title, memberId: anna.id, changeType: 'MEMBER_ADDED', timestamp: daysAgo(5), description: 'Dodano siebie do wydarzenia' },
    ],
  });

  // --- Summary ---
  const counts = {
    members: await prisma.member.count(),
    events: await prisma.event.count(),
    tools: await prisma.tool.count(),
    participants: await prisma.eventParticipant.count(),
    eventTools: await prisma.eventTool.count(),
    changes: await prisma.eventChange.count(),
  };
  console.log('Seed complete:', counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
