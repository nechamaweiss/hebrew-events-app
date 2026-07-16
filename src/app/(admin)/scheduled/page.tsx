import Link from "next/link";
import { prisma } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import { nextOccurrence, renderHebrewFull, renderHebrewDayMonth, HDate } from "@/lib/hebcal";
import { REMINDER_TYPES, reminderTypeLabel, eventTypeLabel } from "@/lib/constants";
import { buildEventEmail } from "@/lib/email-template";
import PreviewEmailButton from "@/components/PreviewEmailButton";

export const dynamic = "force-dynamic";

const ORDER = ["SEVEN_DAYS", "THREE_DAYS", "ONE_DAY", "SAME_DAY"];

type ReminderSetting = {
  sevenDaysBefore: boolean;
  threeDaysBefore: boolean;
  oneDayBefore: boolean;
  sameDay: boolean;
} | null;

function isEnabled(rs: ReminderSetting, rt: string): boolean {
  if (!rs) return false;
  switch (rt) {
    case "SEVEN_DAYS":
      return rs.sevenDaysBefore;
    case "THREE_DAYS":
      return rs.threeDaysBefore;
    case "ONE_DAY":
      return rs.oneDayBefore;
    case "SAME_DAY":
      return rs.sameDay;
    default:
      return false;
  }
}

export default async function ScheduledPage() {
  const [events, business] = await Promise.all([
    prisma.event.findMany({
      where: { active: true },
      include: { reminderSetting: true, eventRecipients: { include: { recipient: true } } },
    }),
    prisma.businessSettings.findUnique({ where: { id: 1 } }),
  ]);

  const now = new Date();

  const items = events
    .map((ev) => {
      const occ = nextOccurrence(
        { hebrewDay: ev.hebrewDay, hebrewMonth: ev.hebrewMonth, hebrewYear: ev.hebrewYear, recurring: ev.recurring },
        now
      );
      const occYear = new HDate(occ).getFullYear();
      const recipients = ev.eventRecipients.map((er) => er.recipient).filter((r) => r.active);
      const emails = ORDER.filter((rt) => isEnabled(ev.reminderSetting, rt)).map((rt) => {
        const days = REMINDER_TYPES[rt].daysBefore;
        const sendDate = new Date(occ.getFullYear(), occ.getMonth(), occ.getDate() - days);
        const subject = business
          ? buildEventEmail({ event: ev, reminderType: rt, business }).subject
          : "";
        return { rt, sendDate, subject };
      });
      return { ev, occ, occYear, recipients, emails };
    })
    .sort((a, b) => a.occ.getTime() - b.occ.getTime());

  const totalEmails = items.reduce((s, i) => s + i.emails.length * Math.max(i.recipients.length, 0), 0);

  return (
    <div>
      <PageHeader
        title="מיילים מתוזמנים"
        subtitle={`תצוגה של כל התזכורות שיישלחו לכל אירוע · ${totalEmails} מיילים מתוכננים במחזור הקרוב`}
      />

      {items.length === 0 ? (
        <div className="card">
          <p className="py-10 text-center muted">אין אירועים פעילים.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(({ ev, occ, occYear, recipients, emails }) => (
            <div key={ev.id} className="card">
              {/* כותרת האירוע */}
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Link href={`/events/${ev.id}`} className="text-lg font-bold heading link">
                    {ev.firstName} {ev.lastName}
                  </Link>
                  <span className="badge badge-gray mr-2">{eventTypeLabel(ev.eventType)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm muted">
                    האירוע: {renderHebrewDayMonth(ev.hebrewDay, ev.hebrewMonth, occYear)}
                  </span>
                  <PreviewEmailButton eventId={ev.id} />
                </div>
              </div>

              {/* נמענים */}
              <div className="mb-3 text-sm">
                <span className="muted">נמענים: </span>
                {recipients.length === 0 ? (
                  <span style={{ color: "var(--color-alert)" }}>אין נמענים — לא יישלחו מיילים ⚠️</span>
                ) : (
                  recipients.map((r) => r.name).join(", ")
                )}
              </div>

              {/* רשימת המיילים */}
              {emails.length === 0 ? (
                <p className="text-sm muted">לא הופעלו תזכורות לאירוע זה.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr className="text-sm muted">
                        <th className="pb-2">סוג התזכורת</th>
                        <th className="pb-2">תאריך שליחה (עברי)</th>
                        <th className="pb-2">נושא המייל</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emails.map((em) => (
                        <tr key={em.rt} style={{ borderTop: "1px solid var(--border-color)" }}>
                          <td className="py-2">
                            <span className="badge badge-green">{reminderTypeLabel(em.rt)}</span>
                          </td>
                          <td className="py-2 font-medium">{renderHebrewFull(em.sendDate)}</td>
                          <td className="py-2 text-sm muted">{em.subject}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
