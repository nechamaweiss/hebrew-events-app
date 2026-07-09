import { prisma } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import RecipientsManager from "@/components/RecipientsManager";

export const dynamic = "force-dynamic";

export default async function RecipientsPage() {
  const recipients = await prisma.recipient.findMany({
    include: { _count: { select: { eventRecipients: true } } },
    orderBy: { name: "asc" },
  });

  const rows = recipients.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    active: r.active,
    eventCount: r._count.eventRecipients,
  }));

  return (
    <div>
      <PageHeader title="מקבלי ההתראות" subtitle={`${recipients.length} נמענים במערכת`} />
      <RecipientsManager rows={rows} />
    </div>
  );
}
