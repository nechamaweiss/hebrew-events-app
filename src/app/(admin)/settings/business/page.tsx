import { prisma } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import BusinessSettingsForm from "@/components/BusinessSettingsForm";

export const dynamic = "force-dynamic";

export default async function BusinessSettingsPage() {
  const s = await prisma.businessSettings.findUnique({ where: { id: 1 } });

  return (
    <div>
      <PageHeader title="הגדרות העסק" subtitle="פרטים אלו מופיעים בכל המערכת ובמיילים הנשלחים" />
      <BusinessSettingsForm
        initial={{
          businessName: s?.businessName ?? "",
          logo: s?.logo ?? null,
          senderEmail: s?.senderEmail ?? "",
          senderName: s?.senderName ?? "",
          phone: s?.phone ?? "",
          address: s?.address ?? "",
          emailSignature: s?.emailSignature ?? "",
          description: s?.description ?? "",
        }}
      />
    </div>
  );
}
