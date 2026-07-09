import { eventTypeGenitive } from "./constants";
import { renderHebrewDayMonth } from "./hebcal";

export interface EmailEventInput {
  firstName: string;
  lastName: string;
  nickname?: string | null;
  eventType: string;
  hebrewDay: number;
  hebrewMonth: string;
  hebrewYear?: number | null;
}

export interface EmailBusinessInput {
  businessName: string;
  senderName: string;
  senderEmail: string;
  emailSignature: string;
  phone?: string | null;
  address?: string | null;
  logo?: string | null;
}

export interface EmailThemeInput {
  primary: string;
  heading: string;
  text: string;
  background: string;
}

const REMINDER_PHRASE: Record<string, string> = {
  SEVEN_DAYS: "בעוד שבוע",
  THREE_DAYS: "בעוד שלושה ימים",
  ONE_DAY: "מחר",
  SAME_DAY: "היום",
  TEST: "בעוד שבוע",
};

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

export function buildEventEmail(params: {
  event: EmailEventInput;
  reminderType: string;
  business: EmailBusinessInput;
  theme?: EmailThemeInput;
  recipientName?: string;
}): BuiltEmail {
  const { event, reminderType, business, recipientName } = params;
  const theme = params.theme || {
    primary: "#4f46e5",
    heading: "#111827",
    text: "#1f2937",
    background: "#f7f8fa",
  };

  const fullName = `${event.firstName} ${event.lastName}`;
  const genitive = eventTypeGenitive(event.eventType); // "יום ההולדת"
  const phrase = REMINDER_PHRASE[reminderType] || "בעוד שבוע";
  const hebrewDate = renderHebrewDayMonth(
    event.hebrewDay,
    event.hebrewMonth,
    event.hebrewYear ?? undefined
  );

  const eventPhrase = `${genitive} של ${fullName}`;

  const subject = `תזכורת – ${phrase} יחול ${eventPhrase}`;

  const greeting = recipientName ? `שלום ${recipientName},` : "שלום,";
  const willOccur =
    reminderType === "SAME_DAY" ? "זוהי תזכורת כי היום יחול:" : `זוהי תזכורת כי ${phrase} יחול:`;

  const text = [
    greeting,
    "",
    willOccur,
    "",
    eventPhrase,
    "",
    "תאריך עברי:",
    hebrewDate,
    "",
    business.emailSignature,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:${theme.background};font-family:Arial,'Segoe UI',sans-serif;direction:rtl;">
  <div style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:${theme.primary};padding:22px 28px;text-align:center;">
      ${
        business.logo
          ? `<img src="${business.logo}" alt="${business.businessName}" style="max-height:56px;margin-bottom:8px;" />`
          : ""
      }
      <div style="color:#ffffff;font-size:20px;font-weight:700;">${business.businessName}</div>
    </div>
    <div style="padding:28px;color:${theme.text};font-size:16px;line-height:1.7;text-align:right;">
      <p style="margin:0 0 14px;">${greeting}</p>
      <p style="margin:0 0 6px;">${willOccur}</p>
      <p style="margin:14px 0;font-size:20px;font-weight:700;color:${theme.heading};">${eventPhrase}</p>
      <div style="background:${theme.background};border-radius:10px;padding:14px 18px;margin:18px 0;">
        <div style="font-size:13px;color:#6b7280;margin-bottom:4px;">תאריך עברי</div>
        <div style="font-size:18px;font-weight:700;color:${theme.heading};">${hebrewDate}</div>
      </div>
      <div style="margin-top:24px;color:#4b5563;white-space:pre-line;border-top:1px solid #eee;padding-top:16px;">${escapeHtml(
        business.emailSignature
      )}</div>
      ${
        business.phone || business.address
          ? `<div style="margin-top:8px;font-size:13px;color:#9ca3af;">${[
              business.phone,
              business.address,
            ]
              .filter(Boolean)
              .join(" · ")}</div>`
          : ""
      }
    </div>
  </div>
</body>
</html>`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
