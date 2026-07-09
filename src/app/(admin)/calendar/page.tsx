import { prisma } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import CalendarView from "@/components/CalendarView";
import {
  HDate,
  todayHebrew,
  resolveMonthNumber,
  daysInMonthNum,
  hebrewDayOfWeek,
  monthNameHebrew,
  monthsSequenceForYear,
  renderHebrewYear,
} from "@/lib/hebcal";
import { eventTypeLabel } from "@/lib/constants";

export const dynamic = "force-dynamic";

function navMonth(year: number, monthNum: number, dir: number) {
  const seq = monthsSequenceForYear(year).map((s) => s.monthNum);
  const idx = seq.indexOf(monthNum);
  if (dir > 0) {
    if (idx === -1 || idx === seq.length - 1) {
      const next = monthsSequenceForYear(year + 1);
      return { year: year + 1, monthNum: next[0].monthNum };
    }
    return { year, monthNum: seq[idx + 1] };
  } else {
    if (idx <= 0) {
      const prev = monthsSequenceForYear(year - 1);
      return { year: year - 1, monthNum: prev[prev.length - 1].monthNum };
    }
    return { year, monthNum: seq[idx - 1] };
  }
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { y?: string; m?: string };
}) {
  const todayH = todayHebrew();
  let year = Number(searchParams.y) || todayH.getFullYear();
  let monthNum = Number(searchParams.m) || todayH.getMonth();

  // ודא שהחודש קיים בשנה זו (טיפול במעבר בין מעוברת לרגילה)
  const seq = monthsSequenceForYear(year).map((s) => s.monthNum);
  if (!seq.includes(monthNum)) monthNum = todayH.getFullYear() === year ? todayH.getMonth() : seq[0];

  const monthName = monthNameHebrew(monthNum, year);
  const daysInMonth = daysInMonthNum(monthNum, year);
  const firstDow = hebrewDayOfWeek(1, monthNum, year); // 0=ראשון

  // אירועים בחודש זה
  const events = await prisma.event.findMany({
    where: { active: true },
    include: { eventRecipients: true },
  });

  const byDay: Record<number, { id: number; name: string; type: string; recurring: boolean }[]> = {};
  for (const e of events) {
    const resolved = resolveMonthNumber(e.hebrewMonth, year);
    if (resolved !== monthNum) continue;
    if (!e.recurring && e.hebrewYear !== year) continue;
    const day = Math.min(e.hebrewDay, daysInMonth);
    (byDay[day] ||= []).push({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      type: eventTypeLabel(e.eventType),
      recurring: e.recurring,
    });
  }

  const prev = navMonth(year, monthNum, -1);
  const next = navMonth(year, monthNum, 1);

  const isCurrentMonth = todayH.getFullYear() === year && todayH.getMonth() === monthNum;
  const todayDay = isCurrentMonth ? todayH.getDate() : null;

  return (
    <div>
      <PageHeader title="לוח שנה עברי" subtitle="ניווט בין החודשים וצפייה באירועים" />
      <CalendarView
        year={year}
        yearLabel={renderHebrewYear(year)}
        monthName={monthName}
        daysInMonth={daysInMonth}
        firstDow={firstDow}
        byDay={byDay}
        todayDay={todayDay}
        prev={prev}
        next={next}
      />
    </div>
  );
}
