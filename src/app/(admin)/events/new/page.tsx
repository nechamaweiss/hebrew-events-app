import { prisma } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import EventForm from "@/components/EventForm";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const [recipients, otherEvents] = await Promise.all([
    prisma.recipient.findMany({ orderBy: { name: "asc" } }),
    prisma.event.findMany({ select: { id: true, firstName: true, lastName: true }, orderBy: { firstName: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="אירוע חדש" subtitle="הוספת אירוע/שמחה חדשים" />
      <EventForm recipients={recipients} otherEvents={otherEvents} />
    </div>
  );
}
