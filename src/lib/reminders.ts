import { prisma } from "./db";
import { sendMail } from "./mailer";
import { buildEventEmail } from "./email-template";
import { daysUntilNext, hebrewDateKey } from "./hebcal";
import { REMINDER_TYPES } from "./constants";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ReminderRunResult {
  runDate: string;
  hebrewKey: string;
  sent: number;
  skipped: number;
  failed: number;
  details: string[];
}

/** מחזיר את מזהה סוג התזכורת לפי מספר הימים, אם קיים */
function reminderTypeForDays(days: number): string | null {
  for (const [id, cfg] of Object.entries(REMINDER_TYPES)) {
    if (cfg.daysBefore === days) return id;
  }
  return null;
}

async function loadSettings() {
  const business = await prisma.businessSettings.findUnique({ where: { id: 1 } });
  const theme = await prisma.themeSettings.findUnique({ where: { id: 1 } });
  return { business, theme };
}

async function notifyAdmin(subject: string, body: string) {
  const admin = await prisma.admin.findFirst();
  const { business } = await loadSettings();
  if (!admin) return;
  await sendMail({
    to: admin.email,
    subject: `[התראת מערכת] ${subject}`,
    text: body,
    html: `<div dir="rtl" style="font-family:Arial;text-align:right;">${body.replace(/\n/g, "<br>")}</div>`,
    fromName: business?.senderName,
    fromEmail: business?.senderEmail,
  });
  await prisma.emailLog.create({
    data: {
      reminderType: "ADMIN_ALERT",
      recipientEmail: admin.email,
      subject: `[התראת מערכת] ${subject}`,
      status: "SUCCESS",
    },
  });
}

/**
 * מנוע התזכורות: בודק אילו תזכורות אמורות להישלח ב-runDate ושולח אותן.
 * נמנע משליחה כפולה לפי (event, recipient, reminderType, hebrewDateKey).
 */
export async function runReminders(runDate: Date = new Date()): Promise<ReminderRunResult> {
  const hebrewKey = hebrewDateKey(runDate);
  const result: ReminderRunResult = {
    runDate: runDate.toISOString().slice(0, 10),
    hebrewKey,
    sent: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  const { business, theme } = await loadSettings();
  if (!business) {
    result.details.push("שגיאה: הגדרות עסק חסרות");
    return result;
  }

  const themeInput = theme
    ? {
        primary: theme.primary,
        secondary: theme.secondary,
        heading: theme.headingColor,
        text: theme.textColor,
        background: theme.background,
      }
    : undefined;

  const events = await prisma.event.findMany({
    where: { active: true },
    include: {
      reminderSetting: true,
      eventRecipients: { include: { recipient: true } },
    },
  });

  for (const ev of events) {
    // אירוע חסר נתונים קריטיים → התראת מנהל
    if (!ev.hebrewDay || !ev.hebrewMonth) {
      await notifyAdmin(
        "אירוע חסר נתונים",
        `לאירוע "${ev.firstName} ${ev.lastName}" (מזהה ${ev.id}) חסר תאריך עברי תקין.`
      );
      continue;
    }

    const days = daysUntilNext(
      {
        hebrewDay: ev.hebrewDay,
        hebrewMonth: ev.hebrewMonth,
        hebrewYear: ev.hebrewYear,
        recurring: ev.recurring,
      },
      runDate
    );

    const reminderType = reminderTypeForDays(days);
    if (!reminderType) continue;

    // האם התזכורת מופעלת בהגדרות?
    const rs = ev.reminderSetting;
    const field = REMINDER_TYPES[reminderType].field as keyof typeof rs;
    if (!rs || !rs[field]) continue;

    for (const er of ev.eventRecipients) {
      const recipient = er.recipient;
      if (!recipient.active) continue;

      // מניעת כפילות
      const existing = await prisma.emailLog.findFirst({
        where: {
          eventId: ev.id,
          recipientId: recipient.id,
          reminderType,
          hebrewDateKey: hebrewKey,
          status: "SUCCESS",
        },
      });
      if (existing) {
        result.skipped++;
        continue;
      }

      // כתובת מייל לא תקינה → התראת מנהל + לוג כשל
      if (!EMAIL_RE.test(recipient.email)) {
        await prisma.emailLog.create({
          data: {
            eventId: ev.id,
            recipientId: recipient.id,
            recipientEmail: recipient.email,
            reminderType,
            hebrewDateKey: hebrewKey,
            status: "FAILED",
            errorMessage: "כתובת מייל אינה תקינה",
          },
        });
        await notifyAdmin(
          "כתובת מייל אינה תקינה",
          `לנמען "${recipient.name}" באירוע "${ev.firstName} ${ev.lastName}" כתובת מייל לא תקינה: ${recipient.email}`
        );
        result.failed++;
        continue;
      }

      const email = buildEventEmail({
        event: ev,
        reminderType,
        business,
        theme: themeInput,
        recipientName: recipient.name,
      });

      const send = await sendMail({
        to: recipient.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        fromName: business.senderName,
        fromEmail: business.senderEmail,
      });

      await prisma.emailLog.create({
        data: {
          eventId: ev.id,
          recipientId: recipient.id,
          recipientEmail: recipient.email,
          reminderType,
          hebrewDateKey: hebrewKey,
          subject: email.subject,
          status: send.success ? "SUCCESS" : "FAILED",
          errorMessage: send.error,
        },
      });

      if (send.success) {
        result.sent++;
        result.details.push(`✓ ${recipient.email} — ${email.subject}`);
      } else {
        result.failed++;
        result.details.push(`✗ ${recipient.email} — ${send.error}`);
        await notifyAdmin(
          "שליחת מייל נכשלה",
          `שליחת תזכורת לנמען "${recipient.name}" (${recipient.email}) עבור "${ev.firstName} ${ev.lastName}" נכשלה: ${send.error}`
        );
      }
    }
  }

  return result;
}
