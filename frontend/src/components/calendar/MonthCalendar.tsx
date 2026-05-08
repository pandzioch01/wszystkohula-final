import type { EventListItem } from '../../types/api';

interface MonthCalendarProps {
  /** Any date in the month to render. */
  monthDate: Date;
  events: EventListItem[];
  onEventClick: (event: EventListItem) => void;
}

const WEEKDAY_LABELS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];

const PILL_COLORS = [
  'bg-blue-500',
  'bg-orange-400',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-amber-500',
];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// Monday-based week start (Polish convention).
function startOfWeekMonday(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  const day = r.getDay(); // 0 = Sunday
  const offset = (day + 6) % 7; // Monday → 0, Sunday → 6
  r.setDate(r.getDate() - offset);
  return r;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(d.getDate() + n);
  return r;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface EventSegment {
  ev: EventListItem;
  startCol: number; // 0–6 within the week (Monday = 0)
  span: number;     // 1–7 columns
}

/**
 * For one week, return the segments of every event that overlaps that week.
 * A multi-week event becomes multiple segments (one per week it touches),
 * each clamped to the week's date range.
 */
function computeWeekSegments(week: Date[], events: EventListItem[]): EventSegment[] {
  const weekStart = week[0];
  const weekEnd = week[6]; // inclusive
  const dayMs = 86400000;

  const segments: EventSegment[] = [];
  for (const ev of events) {
    // Strip times so the comparison is purely day-level.
    const evStart = new Date(ev.startDate);
    const evStartDay = new Date(evStart.getFullYear(), evStart.getMonth(), evStart.getDate());
    const evEnd = new Date(ev.endDate);
    const evEndDay = new Date(evEnd.getFullYear(), evEnd.getMonth(), evEnd.getDate());

    // Overlap with this week?
    if (evStartDay > weekEnd || evEndDay < weekStart) continue;

    const segStart = evStartDay < weekStart ? weekStart : evStartDay;
    const segEnd = evEndDay > weekEnd ? weekEnd : evEndDay;

    const startCol = Math.round((segStart.getTime() - weekStart.getTime()) / dayMs);
    const endCol = Math.round((segEnd.getTime() - weekStart.getTime()) / dayMs);

    segments.push({ ev, startCol, span: endCol - startCol + 1 });
  }

  // Place earlier-starting events first so the auto-flow order is intuitive;
  // for ties, longer spans first (visually dominant bars on top).
  segments.sort((a, b) => a.startCol - b.startCol || b.span - a.span);
  return segments;
}

export function MonthCalendar({ monthDate, events, onEventClick }: MonthCalendarProps) {
  const monthStart = startOfMonth(monthDate);
  const gridStart = startOfWeekMonday(monthStart);
  const today = new Date();

  // 6 weeks × 7 days = 42 cells. Build as 6 weeks for per-week segment math.
  const weeks: Date[][] = Array.from({ length: 6 }, (_, wi) =>
    Array.from({ length: 7 }, (_, di) => addDays(gridStart, wi * 7 + di))
  );

  function colorFor(ev: EventListItem) {
    return PILL_COLORS[ev.id % PILL_COLORS.length];
  }

  return (
    <div className="flex flex-col h-full border border-gray-300 rounded overflow-hidden">
      {/* Weekday header */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-300">
        {WEEKDAY_LABELS.map((w) => (
          <div
            key={w}
            className="p-2 text-center text-sm font-medium text-gray-600"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Week rows */}
      <div className="flex flex-col flex-1">
        {weeks.map((week, wi) => {
          const segments = computeWeekSegments(week, events);
          return (
            <div
              key={wi}
              className="relative grid grid-cols-7 flex-1 min-h-[100px] sm:min-h-[120px] border-b border-gray-200 last:border-b-0"
            >
              {/* Day cells (background + day numbers + right border) */}
              {week.map((cell) => {
                const inMonth = cell.getMonth() === monthDate.getMonth();
                const isToday = isSameDay(cell, today);
                return (
                  <div
                    key={cell.toISOString()}
                    className={`border-r border-gray-200 last:border-r-0 p-1 ${
                      inMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
                    }`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 text-xs sm:text-sm rounded-full ${
                        isToday ? 'bg-orange-400 text-white font-semibold' : ''
                      }`}
                    >
                      {cell.getDate()}
                    </span>
                  </div>
                );
              })}

              {/* Event bars overlay — same 7-col grid, lets bars span columns. */}
              <div className="absolute inset-x-0 top-8 grid grid-cols-7 gap-y-1 px-1 pointer-events-none">
                {segments.map(({ ev, startCol, span }) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => onEventClick(ev)}
                    title={ev.title}
                    style={{
                      gridColumn: `${startCol + 1} / span ${span}`,
                    }}
                    className={`pointer-events-auto text-xs ${colorFor(
                      ev
                    )} text-white px-2 py-0.5 rounded-full truncate hover:opacity-80 transition-opacity`}
                  >
                    {ev.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
