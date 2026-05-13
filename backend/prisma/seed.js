const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Wipe every table and reset identity sequences. Member id=1 (Magdalena
  // below) is what the frontend hardcodes for the logged-in user.
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE event_changes, event_tools, event_participants, events, tools, members RESTART IDENTITY CASCADE'
  );

  // --- Members ---
  const [magda, jakub, patrycja, bartosz, natalia, adrian, weronika] = await Promise.all([
    prisma.member.create({
      data: {
        email: 'magdalena.pawlak@example.com',
        name: 'Magdalena Pawlak',
        city: 'Warszawa',
        specializations: ['Reżyseria produkcji', 'Koordynacja zespołów'],
        ownedTools: ['Laptop MacBook Air M3', 'Tablet graficzny Wacom'],
      },
    }),
    prisma.member.create({
      data: {
        email: 'jakub.wojcik@example.com',
        name: 'Jakub Wójcik',
        city: 'Kraków',
        specializations: ['Akustyka', 'Mastering live'],
        ownedTools: ['Słuchawki referencyjne Beyerdynamic DT 1990 Pro'],
      },
    }),
    prisma.member.create({
      data: {
        email: 'patrycja.kaminska@example.com',
        name: 'Patrycja Kamińska',
        city: 'Gdańsk',
        specializations: ['Catering', 'Obsługa VIP'],
        ownedTools: [],
      },
    }),
    prisma.member.create({
      data: {
        email: 'bartosz.krawczyk@example.com',
        name: 'Bartosz Krawczyk',
        city: 'Poznań',
        specializations: ['Oświetlenie sceniczne', 'Programowanie konsol GrandMA'],
        ownedTools: ['Miernik luksów Sekonic'],
      },
    }),
    prisma.member.create({
      data: {
        email: 'natalia.mazur@example.com',
        name: 'Natalia Mazur',
        city: 'Wrocław',
        specializations: ['Operator kamery', 'Multicam'],
        ownedTools: ['Dron DJI Mavic 3 Pro'],
      },
    }),
    prisma.member.create({
      data: {
        email: 'adrian.gorski@example.com',
        name: 'Adrian Górski',
        city: 'Łódź',
        specializations: ['Logistyka', 'Transport sprzętu', 'BHP'],
        ownedTools: ['Telefon służbowy iPhone 15'],
      },
    }),
    prisma.member.create({
      data: {
        email: 'weronika.sikora@example.com',
        name: 'Weronika Sikora',
        city: 'Szczecin',
        specializations: ['Realizacja wideo', 'Streaming live', 'Postprodukcja'],
        ownedTools: ['MacBook Pro 16" M3', 'Mikrofon Rode NTG5'],
      },
    }),
  ]);

  // --- Tools ---
  // owner: null = org-owned; otherwise a person name OR company name.
  const [
    konsola, reflektor, statyw, subwoofer, mikrofony,
    djStation, plotki, kontener, paletowy, drabina,
    walizka, apteczka,
  ] = await Promise.all([
    prisma.tool.create({
      data: {
        name: 'Konsola Yamaha MGP24X',
        description: '24-kanałowa, analogowa, z efektami',
        imageUrl: 'https://placehold.co/200x200?text=Konsola',
        owner: null,
        status: 'IN_STORAGE',
        location: 'Magazyn główny, regał A1',
      },
    }),
    prisma.tool.create({
      data: {
        name: 'Reflektor LED RGB Cameo Studio PAR',
        description: '64 diody, DMX, bezprzewodowy',
        imageUrl: 'https://placehold.co/200x200?text=Reflektor',
        owner: 'Bartosz Krawczyk',
        status: 'IN_STORAGE',
        location: 'Magazyn światła',
      },
    }),
    prisma.tool.create({
      data: {
        name: 'Statyw oświetleniowy 4m',
        description: 'Wytrzymały, do 50 kg',
        imageUrl: 'https://placehold.co/200x200?text=Statyw',
        owner: null,
        status: 'AT_EVENT',
        location: 'Festiwal Wrocław Beats',
      },
    }),
    prisma.tool.create({
      data: {
        name: 'Subwoofer JBL VRX918SP',
        description: 'Aktywny, 18 cali, 1500W',
        imageUrl: 'https://placehold.co/200x200?text=Subwoofer',
        owner: null,
        status: 'AT_EVENT',
        location: 'Festiwal Wrocław Beats',
      },
    }),
    prisma.tool.create({
      data: {
        name: 'Zestaw mikrofonów Sennheiser EW100',
        description: '4 nadajniki, 1 odbiornik, headset + lavalier',
        imageUrl: 'https://placehold.co/200x200?text=Mikrofony',
        owner: 'Jakub Wójcik',
        status: 'BORROWED',
        location: 'U Magdaleny',
        borrowedById: magda.id,
        borrowedSince: new Date(Date.now() - 5 * 86400000),
      },
    }),
    prisma.tool.create({
      data: {
        name: 'Stolik DJ Pioneer DDJ-1000',
        description: 'Kontroler 4-deckowy z mikserem',
        imageUrl: 'https://placehold.co/200x200?text=DJ',
        owner: 'Soundtech Sp. z o.o.',
        status: 'IN_STORAGE',
        location: 'Magazyn główny, regał B2',
      },
    }),
    prisma.tool.create({
      data: {
        name: 'Płotki ochronne (10 szt.)',
        description: 'Metalowe, czarne, ze stopkami',
        imageUrl: 'https://placehold.co/200x200?text=Plotki',
        owner: null,
        status: 'IN_STORAGE',
        location: 'Magazyn zewnętrzny',
      },
    }),
    prisma.tool.create({
      data: {
        name: 'Kontener transportowy',
        description: 'Aluminiowy, 1.2x0.8m, z kółkami',
        imageUrl: 'https://placehold.co/200x200?text=Kontener',
        owner: 'TransLog Sp. z o.o.',
        status: 'IN_STORAGE',
        location: 'Magazyn główny, strefa C',
      },
    }),
    prisma.tool.create({
      data: {
        name: 'Wózek paletowy',
        description: 'Ręczny, udźwig 2000 kg',
        imageUrl: 'https://placehold.co/200x200?text=Wozek',
        owner: null,
        status: 'MAINTENANCE',
        location: 'Serwis – wymiana łożysk',
      },
    }),
    prisma.tool.create({
      data: {
        name: 'Drabina rozkładana 6m',
        description: 'Aluminiowa, trzyczęściowa',
        imageUrl: 'https://placehold.co/200x200?text=Drabina',
        owner: 'Adrian Górski',
        status: 'IN_STORAGE',
        location: 'Magazyn główny',
      },
    }),
    prisma.tool.create({
      data: {
        name: 'Walizka narzędziowa elektryka',
        description: 'Komplet podstawowy + multimetr',
        imageUrl: 'https://placehold.co/200x200?text=Walizka',
        owner: null,
        status: 'LOST',
        location: 'Nieznana — ostatnio Premiera Tech Mobile X',
      },
    }),
    prisma.tool.create({
      data: {
        name: 'Apteczka eventowa',
        description: 'Pełna, ważna do 2028',
        imageUrl: 'https://placehold.co/200x200?text=Apteczka',
        owner: 'BHP Service Sp. z o.o.',
        status: 'IN_STORAGE',
        location: 'Magazyn główny, przy wejściu',
      },
    }),
  ]);

  // --- Events ---
  const now = new Date();
  const daysAgo = (n) => new Date(now.getTime() - n * 86400000);
  const daysFromNow = (n) => new Date(now.getTime() + n * 86400000);

  const targi = await prisma.event.create({
    data: {
      title: 'Targi Budowlane 2026',
      description: 'Coroczne targi branży budowlanej — stoiska, prezentacje, networking.',
      clientName: 'Polska Izba Budownictwa',
      firmsNames: ['AudioPro', 'BudExpo'],
      startDate: daysAgo(60),
      endDate: daysAgo(58),
    },
  });

  const premiera = await prisma.event.create({
    data: {
      title: 'Premiera produktu Tech Mobile X',
      description: 'Wieczorna gala premierowa nowego smartfona.',
      clientName: 'Tech Mobile',
      firmsNames: ['VisualWorks', 'Catering Premium'],
      startDate: daysAgo(14),
      endDate: daysAgo(13),
    },
  });

  const festiwal = await prisma.event.create({
    data: {
      title: 'Festiwal Wrocław Beats',
      description: 'Trzydniowy festiwal muzyki elektronicznej. 3 sceny, 20+ artystów.',
      clientName: 'Stowarzyszenie Wrocław Beats',
      firmsNames: ['SoundMaster', 'StageDesign', 'Catering Premium'],
      startDate: daysAgo(1),
      endDate: daysFromNow(3),
    },
  });

  const networking = await prisma.event.create({
    data: {
      title: 'Spotkanie networkingowe IT',
      description: 'Half-day event dla startupów i inwestorów.',
      clientName: 'IT Połączeni Foundation',
      firmsNames: ['TechVenue'],
      startDate: daysFromNow(7),
      endDate: daysFromNow(7),
    },
  });

  const wesele = await prisma.event.create({
    data: {
      title: 'Wesele Anna i Jan',
      description: 'Wesele plenerowe, 120 gości, oprawa DJ + zespół.',
      clientName: 'Anna i Jan',
      firmsNames: ['Catering Premium', 'FloralArt'],
      startDate: daysFromNow(30),
      endDate: daysFromNow(30),
    },
  });

  const gala = await prisma.event.create({
    data: {
      title: 'Gala charytatywna 2026',
      description: 'Aukcja charytatywna, gala wieczorowa, transmisja online.',
      clientName: 'Fundacja Promyk Nadziei',
      firmsNames: ['AudioPro', 'StageDesign'],
      startDate: daysFromNow(90),
      endDate: daysFromNow(90),
    },
  });

  // --- EventParticipants ---
  await prisma.eventParticipant.createMany({
    data: [
      // Targi
      { eventId: targi.id, memberId: magda.id },
      { eventId: targi.id, memberId: adrian.id },
      { eventId: targi.id, memberId: bartosz.id },

      // Premiera
      { eventId: premiera.id, memberId: magda.id },
      { eventId: premiera.id, memberId: natalia.id },
      { eventId: premiera.id, memberId: weronika.id },

      // Festiwal (ongoing)
      { eventId: festiwal.id, memberId: jakub.id },
      { eventId: festiwal.id, memberId: bartosz.id },
      { eventId: festiwal.id, memberId: magda.id },
      { eventId: festiwal.id, memberId: adrian.id },
      { eventId: festiwal.id, memberId: natalia.id },

      // Networking
      { eventId: networking.id, memberId: patrycja.id },
      { eventId: networking.id, memberId: magda.id },

      // Wesele
      { eventId: wesele.id, memberId: patrycja.id },
      { eventId: wesele.id, memberId: magda.id },
      { eventId: wesele.id, memberId: adrian.id },

      // Gala
      { eventId: gala.id, memberId: magda.id },
      { eventId: gala.id, memberId: jakub.id },
      { eventId: gala.id, memberId: natalia.id },
    ],
  });

  // --- EventTools ---
  await prisma.eventTool.createMany({
    data: [
      // Targi (past, returned)
      { eventId: targi.id, toolId: konsola.id, assignedAt: daysAgo(61), returnedAt: daysAgo(57) },
      { eventId: targi.id, toolId: statyw.id, assignedAt: daysAgo(61), returnedAt: daysAgo(57) },

      // Premiera (past, returned)
      { eventId: premiera.id, toolId: subwoofer.id, assignedAt: daysAgo(15), returnedAt: daysAgo(12) },

      // Festiwal (ongoing, still out)
      { eventId: festiwal.id, toolId: statyw.id, assignedAt: daysAgo(2), returnedAt: null },
      { eventId: festiwal.id, toolId: subwoofer.id, assignedAt: daysAgo(2), returnedAt: null },

      // Wesele (pre-assigned)
      { eventId: wesele.id, toolId: konsola.id, assignedAt: daysFromNow(29), returnedAt: null },

      // Gala (pre-assigned, far future)
      { eventId: gala.id, toolId: konsola.id, assignedAt: daysFromNow(89), returnedAt: null },
    ],
  });

  // --- EventChanges (audit log) ---
  // Magdalena (id=1) is the hardcoded logged-in user, so she gets the most
  // entries so the Notifications page has rich data on first load.
  await prisma.eventChange.createMany({
    data: [
      // Targi
      { eventId: targi.id, eventTitleSnapshot: targi.title, memberId: magda.id, changeType: 'CREATED', timestamp: daysAgo(80), description: 'Wydarzenie utworzone' },
      { eventId: targi.id, eventTitleSnapshot: targi.title, memberId: magda.id, changeType: 'MEMBER_ADDED', timestamp: daysAgo(75), description: 'Dodano Adriana i Bartosza' },
      { eventId: targi.id, eventTitleSnapshot: targi.title, memberId: magda.id, changeType: 'TOOL_ASSIGNED', timestamp: daysAgo(61), description: 'Przypisano konsolę i statyw' },
      { eventId: targi.id, eventTitleSnapshot: targi.title, memberId: adrian.id, changeType: 'TOOL_RETURNED', timestamp: daysAgo(57), description: 'Zwrócono cały sprzęt' },

      // Premiera
      { eventId: premiera.id, eventTitleSnapshot: premiera.title, memberId: magda.id, changeType: 'CREATED', timestamp: daysAgo(35), description: 'Wydarzenie utworzone' },
      { eventId: premiera.id, eventTitleSnapshot: premiera.title, memberId: magda.id, changeType: 'UPDATED', timestamp: daysAgo(20), description: 'Zaktualizowano lokalizację' },
      { eventId: premiera.id, eventTitleSnapshot: premiera.title, memberId: weronika.id, changeType: 'TOOL_ASSIGNED', timestamp: daysAgo(15), description: 'Przypisano subwoofer' },

      // Festiwal
      { eventId: festiwal.id, eventTitleSnapshot: festiwal.title, memberId: jakub.id, changeType: 'CREATED', timestamp: daysAgo(90), description: 'Wydarzenie utworzone' },
      { eventId: festiwal.id, eventTitleSnapshot: festiwal.title, memberId: magda.id, changeType: 'MEMBER_ADDED', timestamp: daysAgo(45), description: 'Dodano siebie do projektu' },
      { eventId: festiwal.id, eventTitleSnapshot: festiwal.title, memberId: magda.id, changeType: 'TOOL_ASSIGNED', timestamp: daysAgo(2), description: 'Przypisano statyw i subwoofer' },
      { eventId: festiwal.id, eventTitleSnapshot: festiwal.title, memberId: magda.id, changeType: 'UPDATED', timestamp: daysAgo(1), description: 'Zaktualizowano harmonogram' },

      // Networking
      { eventId: networking.id, eventTitleSnapshot: networking.title, memberId: patrycja.id, changeType: 'CREATED', timestamp: daysAgo(20), description: 'Wydarzenie utworzone' },
      { eventId: networking.id, eventTitleSnapshot: networking.title, memberId: magda.id, changeType: 'MEMBER_ADDED', timestamp: daysAgo(10), description: 'Dodano siebie do wydarzenia' },

      // Wesele
      { eventId: wesele.id, eventTitleSnapshot: wesele.title, memberId: magda.id, changeType: 'CREATED', timestamp: daysAgo(15), description: 'Wydarzenie utworzone' },
      { eventId: wesele.id, eventTitleSnapshot: wesele.title, memberId: magda.id, changeType: 'TOOL_ASSIGNED', timestamp: daysAgo(3), description: 'Wstępnie zarezerwowano konsolę' },

      // Gala
      { eventId: gala.id, eventTitleSnapshot: gala.title, memberId: jakub.id, changeType: 'CREATED', timestamp: daysAgo(5), description: 'Wydarzenie utworzone' },
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
