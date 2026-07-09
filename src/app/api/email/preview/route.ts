import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, ok, bad } from "@/lib/api";
import { buildEventEmail } from "@/lib/email-template";
import { getTheme } from "@/lib/theme";

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const b = await req.json().catch(() => ({}));
  const reminderType = b.reminderType || "SEVEN_DAYS";

  const business = await prisma.businessSettings.findUnique({ where: { id: 1 } });
  if (!business) return bad("הגדרות עסק חסרות");
  const theme = await getTheme();

  // אפשר לקבל eventId (אירוע קיים) או פרטי אירוע ישירות (טופס לא שמור)
  let eventData = b.event;
  if (b.eventId) {
    const ev = await prisma.event.findUnique({ where: { id: Number(b.eventId) } });
    if (!ev) return bad("אירוע לא נמצא", 404);
    eventData = ev;
  }
  if (!eventData?.firstName || !eventData?.hebrewMonth) return bad("חסרים פרטי אירוע לתצוגה");

  const email = buildEventEmail({
    event: eventData,
    reminderType,
    business,
    theme: {
      primary: theme.primary,
      heading: theme.headingColor,
      text: theme.textColor,
      background: theme.background,
    },
    recipientName: b.recipientName || "משפחה יקרה",
  });

  return ok({
    ...email,
    fromName: business.senderName,
    fromEmail: business.senderEmail,
    to: b.recipientName || "משפחה יקרה",
  });
}
