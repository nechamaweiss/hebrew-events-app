import Link from "next/link";
import { prisma } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import EventsTable from "@/components/EventsTable";
import { renderHebrewDayMonth } from "@/lib/hebcal";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    include: {
      eventRecipients: true,
      linkedRelative: true,
    },
    orderBy: [{ hebrewMonth: "asc" }, { hebrewDay: "asc" }],
  });

  const rows = events.map((e) => ({
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
    nickname: e.nickname,
    eventType: e.eventType,
    hebrewDay: e.hebrewDay,
    hebrewMonth: e.hebrewMonth,
    hebrewYear: e.hebrewYear,
    recurring: e.recurring,
    active: e.active,
    hebrewDate: renderHebrewDayMonth(e.hebrewDay, e.hebrewMonth, e.hebrewYear ?? undefined),
    recipientCount: e.eventRecipients.length,
    linkedRelativeName: e.linkedRelative ? `${e.linkedRelative.firstName} ${e.linkedRelative.lastName}` : null,
    relationLabel: e.relationLabel,
  }));

  return (
    <div>
      <PageHeader
        title="ניהול אירועים"
        subtitle={`${events.length} אירועים במערכת`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/events/from-birth" className="btn-ghost">
              🎂 הוספה לפי תאריך לידה
            </Link>
            <Link href="/events/new" className="btn">
              + אירוע חדש
            </Link>
          </div>
        }
      />
      <EventsTable rows={rows} />
    </div>
  );
}
