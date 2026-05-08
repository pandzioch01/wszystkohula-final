import { useState } from 'react';
import { useEvents, useDeleteEvent } from '../hooks/useEvents';
import { CURRENT_MEMBER_ID } from '../lib/auth';
import { MonthCalendar } from '../components/calendar/MonthCalendar';
import { EventDetailsModal } from '../components/calendar/EventDetailsModal';
import { EventFormModal } from '../components/calendar/EventFormModal';

const POLISH_MONTHS = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];

export default function Calendar() {
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [openedEventId, setOpenedEventId] = useState<number | null>(null);
  const [formMode, setFormMode] = useState<number | 'create' | null>(null);

  // Fetch a window slightly larger than the visible month, so events that
  // overlap from adjacent months still appear in their leading/trailing cells.
  const start = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() - 1,
    1
  ).toISOString();
  const end = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 2,
    1
  ).toISOString();

  const { data: events = [], isLoading, error } = useEvents({ start, end });
  const deleteMut = useDeleteEvent();

  function gotoPrev() {
    setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1));
  }
  function gotoNext() {
    setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1));
  }
  function gotoToday() {
    setMonthDate(new Date());
  }

  async function handleDelete(id: number) {
    if (!confirm('Usunąć ten event?')) return;
    await deleteMut.mutateAsync({ id, actorMemberId: CURRENT_MEMBER_ID });
    setOpenedEventId(null);
  }

  return (
    <div className="flex flex-col h-screen p-3 sm:p-4">
      {/* Month nav */}
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={gotoPrev}
          aria-label="Poprzedni miesiąc"
          className="px-3 py-1 rounded border hover:bg-gray-50"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={gotoToday}
          className="px-3 py-1 rounded border hover:bg-gray-50 text-sm"
        >
          Dziś
        </button>
        <h1 className="flex-1 text-center text-xl sm:text-2xl md:text-3xl font-semibold">
          {POLISH_MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
        </h1>
        <button
          type="button"
          onClick={() => setFormMode('create')}
          className="px-3 py-1 rounded border hover:bg-gray-50 text-sm flex items-center gap-2"
        >
          <img src="/add.svg" alt="" className="w-4 h-4" />
          <span className="hidden sm:inline">Dodaj event</span>
        </button>
        <button
          type="button"
          onClick={gotoNext}
          aria-label="Następny miesiąc"
          className="px-3 py-1 rounded border hover:bg-gray-50"
        >
          ›
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-2">Failed to load events.</p>
      )}
      {isLoading && !events.length && (
        <p className="text-gray-500 text-sm mb-2">Loading…</p>
      )}

      <div className="flex-1 min-h-0">
        <MonthCalendar
          monthDate={monthDate}
          events={events}
          onEventClick={(ev) => setOpenedEventId(ev.id)}
        />
      </div>

      {/* Modals */}
      <EventDetailsModal
        eventId={openedEventId}
        onClose={() => setOpenedEventId(null)}
        onEdit={(id) => {
          setOpenedEventId(null);
          setFormMode(id);
        }}
        onDelete={handleDelete}
      />
      <EventFormModal mode={formMode} onClose={() => setFormMode(null)} />
    </div>
  );
}
