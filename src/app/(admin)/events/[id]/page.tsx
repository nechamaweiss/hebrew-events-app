import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import EventForm from "@/components/EventForm";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (Number.isNaN(id)) notFound();

  const [event, recipients, otherEvents] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      include: { reminderSetting: true, eventRecipients: true },
    }),
    prisma.recipient.findMany({ orderBy: { name: "asc" } }),
    prisma.event.findMany({ select: { id: true, firstName: true, lastName: true }, orderBy: { firstName: "asc" } }),
  ]);

  if (!event) notFound();

  const initial = {
    id: event.id,
    firstName: event.firstName,
    lastName: event.lastName,
    nickname: event.nickname ?? "",
    eventType: event.eventType,
    hebrewDay: event.hebrewDay,
    hebrewMonth: event.hebrewMonth,
    hebrewYear: event.hebrewYear,
    recurring: event.recurring,
    notes: event.notes ?? "",
    image: event.image,
    active: event.active,
    linkedRelativeId: event.linkedRelativeId,
    relationLabel: event.relationLabel ?? "",
    reminder: {
      sevenDaysBefore: event.reminderSetting?.sevenDaysBefore ?? true,
      threeDaysBefore: event.reminderSetting?.threeDaysBefore ?? false,
      oneDayBefore: event.reminderSetting?.oneDayBefore ?? true,
      sameDay: event.reminderSetting?.sameDay ?? true,
    },
    recipientIds: event.eventRecipients.map((er) => er.recipientId),
  };

  return (
    <div>
      <PageHeader title="עריכת אירוע" subtitle={`${event.firstName} ${event.lastName}`} />
      <EventForm initial={initial} recipients={recipients} otherEvents={otherEvents} />
    </div>
  );
}
