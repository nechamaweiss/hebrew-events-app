"use client";

import { useState } from "react";
import Link from "next/link";
import { gematriya } from "@hebcal/core";

interface DayEvent {
  id: number;
  name: string;
  type: string;
  recurring: boolean;
}

const WEEKDAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

export default function CalendarView({
  year,
  yearLabel,
  monthName,
  daysInMonth,
  firstDow,
  byDay,
  todayDay,
  prev,
  next,
}: {
  year: number;
  yearLabel: string;
  monthName: string;
  daysInMonth: number;
  firstDow: number;
  byDay: Record<number, DayEvent[]>;
  todayDay: number | null;
  prev: { year: number; monthNum: number };
  next: { year: number; monthNum: number };
}) {
  const [selected, setSelected] = useState<number | null>(null);

  // תאים ריקים לפני היום הראשון
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedEvents = selected ? byDay[selected] || [] : [];

  return (
    <div className="card">
      {/* ניווט */}
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/calendar?y=${prev.year}&m=${prev.monthNum}`} className="btn-ghost">
          → הקודם
        </Link>
        <div className="text-center">
          <div className="text-xl font-bold heading">
            {monthName} {yearLabel}
          </div>
          <Link href="/calendar" className="text-xs link">
            חזרה לחודש הנוכחי
          </Link>
        </div>
        <Link href={`/calendar?y=${next.year}&m=${next.monthNum}`} className="btn-ghost">
          הבא ←
        </Link>
      </div>

      {/* כותרות ימים */}
      <div className="grid grid-cols-7 gap-1 text-center text-sm font-semibold muted">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-2">
            {w}
          </div>
        ))}
      </div>

      {/* רשת ימים */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} />;
          const dayEvents = byDay[d] || [];
          const hasEvents = dayEvents.length > 0;
          const isToday = d === todayDay;
          return (
            <button
              key={d}
              onClick={() => hasEvents && setSelected(d)}
              className="min-h-[70px] rounded-lg p-1.5 text-right transition"
              style={{
                border: isToday ? "2px solid var(--color-primary)" : "1px solid var(--border-color)",
                background: hasEvents ? "color-mix(in srgb, var(--color-primary) 8%, transparent)" : "var(--surface)",
                cursor: hasEvents ? "pointer" : "default",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold heading">{gematriya(d)}</span>
                {hasEvents && (
                  <span
                    className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] text-white"
                    style={{ background: "var(--color-primary)" }}
                  >
                    {dayEvents.length}
                  </span>
                )}
              </div>
              <div className="mt-1 space-y-0.5 overflow-hidden">
                {dayEvents.slice(0, 2).map((ev) => (
                  <div key={ev.id} className="truncate text-[10px]" style={{ color: "var(--color-text)" }}>
                    🎉 {ev.name}
                  </div>
                ))}
                {dayEvents.length > 2 && <div className="text-[10px] muted">+{dayEvents.length - 2} נוספים</div>}
              </div>
            </button>
          );
        })}
      </div>

      {/* מודל אירועי יום */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold heading">
                {gematriya(selected)} {monthName} {yearLabel}
              </h2>
              <button onClick={() => setSelected(null)} className="text-2xl muted" aria-label="סגור">
                ×
              </button>
            </div>
            <div className="space-y-2">
              {selectedEvents.map((ev) => (
                <Link
                  key={ev.id}
                  href={`/events/${ev.id}`}
                  className="flex items-center justify-between rounded-lg p-3"
                  style={{ border: "1px solid var(--border-color)" }}
                >
                  <span className="font-medium">🎉 {ev.name}</span>
                  <span className="badge badge-gray">{ev.type}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
