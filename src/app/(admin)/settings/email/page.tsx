import { prisma } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import EmailSettingsForm from "@/components/EmailSettingsForm";

export const dynamic = "force-dynamic";

export default async function EmailSettingsPage() {
  const s = await prisma.emailSettings.findUnique({ where: { id: 1 } });

  return (
    <div>
      <PageHeader
        title="הגדרות שרת מייל"
        subtitle="חיבור חינמי לשליחת תזכורות אוטומטיות (Gmail, Brevo ועוד)"
      />
      <EmailSettingsForm
        initial={{
          enabled: s?.enabled ?? false,
          provider: s?.provider ?? "gmail",
          host: s?.host ?? "smtp.gmail.com",
          port: s?.port ?? 587,
          secure: s?.secure ?? false,
          username: s?.username ?? "",
          hasPassword: Boolean(s?.password),
        }}
      />
    </div>
  );
}
