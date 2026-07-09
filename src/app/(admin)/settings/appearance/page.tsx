import PageHeader from "@/components/PageHeader";
import ThemeSettingsForm from "@/components/ThemeSettingsForm";
import { getTheme } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function AppearancePage() {
  const theme = await getTheme();
  return (
    <div>
      <PageHeader title="עיצוב והתאמה אישית" subtitle="הצבעים חלים על כל המערכת ועל תבנית המייל" />
      <ThemeSettingsForm initial={theme} />
    </div>
  );
}
