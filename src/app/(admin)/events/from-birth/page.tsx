import { prisma } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import BirthDateForm from "@/components/BirthDateForm";

export const dynamic = "force-dynamic";

export default async function FromBirthPage() {
  const recipients = await prisma.recipient.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader
        title="הוספה לפי תאריך לידה"
        subtitle="הזן תאריך לידה עברי — המערכת תחשב ותיצור אוטומטית את כל אבני הדרך"
      />
      <BirthDateForm recipients={recipients} />
    </div>
  );
}
