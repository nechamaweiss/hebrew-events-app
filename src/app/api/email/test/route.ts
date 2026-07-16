import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, ok, bad } from "@/lib/api";
import { buildEventEmail } from "@/lib/email-template";
import { getTheme } from "@/lib/theme";
import { sendMail } from "@/lib/mailer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const b = await req.json().catch(() => ({}));
  const to = b.to?.trim();
  const reminderType = b.reminderType || "SEVEN_DAYS";
  if (!to || !EMAIL_RE.test(to)) return bad("כתובת מייל לבדיקה אינה תקינה");

  const business = await prisma.businessSettings.findUnique({ where: { id: 1 } });
  if (!business) return bad("הגדרות עסק חסרות");
  const theme = await getTheme();

  let eventData = b.event;
  let eventId: number | null = null;
  if (b.eventId) {
    const ev = await prisma.event.findUnique({ where: { id: Number(b.eventId) } });
    if (!ev) return bad("אירוע לא נמצא", 404);
    eventData = ev;
    eventId = ev.id;
  }
  if (!eventData?.firstName || !eventData?.hebrewMonth) return bad("חסרים פרטי אירוע");

  const email = buildEventEmail({
    event: eventData,
    reminderType,
    business,
    theme: {
      primary: theme.primary,
      secondary: theme.secondary,
      heading: theme.headingColor,
      text: theme.textColor,
      background: theme.background,
    },
    recipientName: "בדיקה",
  });

  const result = await sendMail({
    to,
    subject: `[ניסיון] ${email.subject}`,
    html: email.html,
    text: email.text,
    fromName: business.senderName,
    fromEmail: business.senderEmail,
  });

  await prisma.emailLog.create({
    data: {
      eventId,
      recipientEmail: to,
      reminderType: "TEST",
      subject: `[ניסיון] ${email.subject}`,
      status: result.success ? "SUCCESS" : "FAILED",
      errorMessage: result.error,
    },
  });

  if (!result.success) return bad(result.error || "שליחה נכשלה");

  return ok({
    message: result.simulated
      ? `נשלח במצב הדמיה (SMTP לא מוגדר). המייל תועד בלוג והודפס לקונסול. נמען: ${to}`
      : `נשלח בהצלחה אל ${to}`,
    mode: result.simulated ? "simulation" : "smtp",
  });
}
