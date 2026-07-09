import Link from "next/link";
import { prisma } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import { daysUntilNext, nextOccurrence, renderHebrewDayMonth, todayHebrew, HDate } from "@/lib/hebcal";
import { eventTypeLabel } from "@/lib/constants";

export const dynamic = "force-dynamic";

function startOfToday() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export default async function DashboardPage() {
  const events = await prisma.event.findMany({
    include: { reminderSetting: true, eventRecipients: true },
    orderBy: { createdAt: "desc" },
  });

  const today = startOfToday();
  const todayH = todayHebrew(today);

  const active = events.filter((e) => e.active);
  const withDays = active
    .map((e) => {
      const occ = nextOccurrence(
        { hebrewDay: e.hebrewDay, hebrewMonth: e.hebrewMonth, hebrewYear: e.hebrewYear, recurring: e.recurring },
        today
      );
      const days = daysUntilNext(
        { hebrewDay: e.hebrewDay, hebrewMonth: e.hebrewMonth, hebrewYear: e.hebrewYear, recurring: e.recurring },
        today
      );
      const occH = new HDate(occ);
      return { e, occ, days, occH };
    })
    .sort((a, b) => a.days - b.days);

  const total = events.length;
  const thisMonth = withDays.filter(
    (x) => x.days >= 0 && x.occH.getMonth() === todayH.getMonth() && x.occH.getFullYear() === todayH.getFullYear()
  ).length;
  const nextWeek = withDays.filter((x) => x.days >= 0 && x.days <= 7).length;

  // מיילים שנשלחו היום (הצלחה, תזכורות בלבד)
  const startDay = today;
  const endDay = new Date(today.getTime() + 86400000);
  const sentTodayLogs = await prisma.emailLog.findMany({
    where: {
      status: "SUCCESS",
      sentAt: { gte: startDay, lt: endDay },
      reminderType: { in: ["SEVEN_DAYS", "THREE_DAYS", "ONE_DAY", "SAME_DAY"] },
    },
    select: { eventId: true },
  });
  const sentToday = new Set(sentTodayLogs.map((l) => l.eventId)).size;

  // אירועים בשבוע הקרוב שטרם נשלחה עבורם תזכורת היום
  const sentEventIds = new Set(sentTodayLogs.map((l) => l.eventId));
  const notYetSent = withDays.filter((x) => x.days >= 0 && x.days <= 7 && !sentEventIds.has(x.e.id)).length;

  const upcoming = withDays.filter((x) => x.days >= 0).slice(0, 8);

  const stats = [
    { label: "סה״כ אירועים", value: total, icon: "🎉", color: "var(--color-primary)" },
    { label: "אירועים החודש", value: thisMonth, icon: "🗓️", color: "var(--color-secondary)" },
    { label: "בשבוע הקרוב", value: nextWeek, icon: "⏰", color: "#f59e0b" },
    { label: "נשלחו היום", value: sentToday, icon: "📧", color: "#10b981" },
    { label: "טרם נשלחו", value: notYetSent, icon: "📌", color: "var(--color-alert)" },
  ];

  return (
    <div>
      <PageHeader
        title="לוח בקרה"
        subtitle={`היום: ${renderHebrewDayMonth(todayH.getDate(), monthIdFromNum(todayH), todayH.getFullYear())}`}
      />

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-2xl">{s.icon}</span>
              <span className="text-3xl font-bold" style={{ color: s.color }}>
                {s.value}
              </span>
            </div>
            <div className="text-sm muted">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold heading">אירועים קרובים</h2>
          <Link href="/events" className="text-sm link">
            לכל האירועים ←
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="py-8 text-center muted">אין אירועים קרובים</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr className="text-sm muted">
                  <th className="pb-2">שם</th>
                  <th className="pb-2">סוג</th>
                  <th className="pb-2">תאריך עברי</th>
                  <th className="pb-2">בעוד</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((x) => (
                  <tr key={x.e.id} style={{ borderTop: "1px solid var(--border-color)" }}>
                    <td className="py-3 font-medium">
                      <Link href={`/events/${x.e.id}`} className="link">
                        {x.e.firstName} {x.e.lastName}
                        {x.e.nickname ? ` (${x.e.nickname})` : ""}
                      </Link>
                    </td>
                    <td className="py-3">
                      <span className="badge badge-gray">{eventTypeLabel(x.e.eventType)}</span>
                    </td>
                    <td className="py-3">
                      {renderHebrewDayMonth(x.e.hebrewDay, x.e.hebrewMonth, x.occH.getFullYear())}
                    </td>
                    <td className="py-3">
                      {x.days === 0 ? (
                        <span className="badge badge-green">היום!</span>
                      ) : (
                        <span className="muted">{x.days} ימים</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ממיר מספר חודש hebcal של "היום" למזהה החודש שלנו (לצורך רינדור כותרת)
function monthIdFromNum(hd: InstanceType<typeof HDate>): string {
  const leap = HDate.isLeapYear(hd.getFullYear());
  const m = hd.getMonth();
  const map: Record<number, string> = {
    1: "NISAN",
    2: "IYAR",
    3: "SIVAN",
    4: "TAMUZ",
    5: "AV",
    6: "ELUL",
    7: "TISHREI",
    8: "CHESHVAN",
    9: "KISLEV",
    10: "TEVET",
    11: "SHVAT",
    13: "ADAR_2",
  };
  if (m === 12) return leap ? "ADAR_1" : "ADAR";
  return map[m] || "TISHREI";
}
