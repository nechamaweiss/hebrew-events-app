import { eventTypeGenitive, eventTypeEmoji } from "./constants";
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
  secondary?: string;
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
    secondary: "#0ea5e9",
    heading: "#111827",
    text: "#1f2937",
    background: "#f7f8fa",
  };
  const primary = theme.primary;
  const secondary = theme.secondary || theme.primary;

  const fullName = `${event.firstName} ${event.lastName}`;
  const genitive = eventTypeGenitive(event.eventType); // "יום ההולדת"
  const emoji = eventTypeEmoji(event.eventType);
  const phrase = REMINDER_PHRASE[reminderType] || "בעוד שבוע";
  const hebrewDate = renderHebrewDayMonth(
    event.hebrewDay,
    event.hebrewMonth,
    event.hebrewYear ?? undefined
  );

  const eventPhrase = `${genitive} של ${fullName}`;
  const subject = `תזכורת – ${phrase} יחול ${eventPhrase}`;

  const greeting = recipientName ? `שלום ${recipientName},` : "שלום,";
  const willOccur = reminderType === "SAME_DAY" ? "היום יחול:" : `${phrase} יחול:`;
  const countdown = reminderType === "SAME_DAY" ? `🎉 ${phrase}` : `⏰ ${phrase}`;

  // קונפטי מונפש (CSS) — יורד ומסתובב בפתיחת המייל בלקוחות התומכים (Apple Mail/iOS)
  const confettiColors = ["#ff5964", "#ffd166", "#06d6a0", "#4cc9f0", "#f72585", "#8338ec", "#ffffff", "#ff8fab"];
  let confetti = "";
  for (let i = 0; i < 20; i++) {
    const left = Math.round(3 + (i * 94) / 19);
    const color = confettiColors[i % confettiColors.length];
    const delay = ((i * 0.11) % 1.6).toFixed(2);
    const dur = (1.8 + (i % 5) * 0.2).toFixed(2);
    const top = (i % 4) * 9;
    const rot = i % 2 ? 25 : -20;
    confetti += `<span class="cft" style="left:${left}%;top:${top}px;background:${color};animation-delay:${delay}s;animation-duration:${dur}s;transform:rotate(${rot}deg);"></span>`;
  }

  const text = [
    greeting,
    "",
    `זוהי תזכורת כי ${willOccur}`,
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
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>
@keyframes cftFall { 0%{transform:translateY(-30px) rotate(0deg);opacity:0;} 12%{opacity:1;} 100%{transform:translateY(150px) rotate(400deg);opacity:0;} }
.cft { position:absolute; width:9px; height:15px; border-radius:2px; opacity:.9; animation-name:cftFall; animation-timing-function:ease-in; animation-iteration-count:infinite; }
</style>
</head>
<body style="margin:0;padding:0;background:${theme.background};font-family:'Segoe UI',Arial,sans-serif;direction:rtl;">
  <div style="padding:24px 12px;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.10);">

      <!-- כותרת -->
      <div style="position:relative;overflow:hidden;background:${primary};background:linear-gradient(135deg,${primary},${secondary});padding:34px 28px;text-align:center;">
        <div style="position:absolute;top:0;left:0;right:0;height:130px;pointer-events:none;">${confetti}</div>
        ${
          business.logo
            ? `<img src="${business.logo}" alt="${escapeHtml(business.businessName)}" style="position:relative;max-height:52px;margin-bottom:12px;" />`
            : ""
        }
        <div style="position:relative;width:82px;height:82px;line-height:82px;margin:0 auto 12px;background:rgba(255,255,255,0.22);border-radius:50%;font-size:42px;text-align:center;">${emoji}</div>
        <div style="position:relative;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:.3px;">${escapeHtml(business.businessName)} 🎉</div>
      </div>

      <!-- גוף -->
      <div style="padding:30px 30px 26px;color:${theme.text};font-size:16px;line-height:1.75;text-align:center;">
        <p style="margin:0 0 18px;text-align:right;font-size:16px;">${escapeHtml(greeting)}</p>

        <!-- תגית ספירה לאחור -->
        <div style="display:inline-block;background:${hexToTint(primary)};color:${primary};font-weight:700;font-size:15px;padding:8px 20px;border-radius:999px;margin-bottom:6px;">${countdown}</div>

        <p style="margin:6px 0 4px;color:#6b7280;font-size:15px;">זוהי תזכורת כי ${willOccur}</p>
        <p style="margin:6px 0 20px;font-size:26px;font-weight:800;color:${theme.heading};">${escapeHtml(eventPhrase)}</p>

        <!-- כרטיס תאריך עברי -->
        <div style="background:${theme.background};border:1px solid #eef0f3;border-radius:14px;padding:18px;margin:0 auto 8px;max-width:320px;">
          <div style="font-size:13px;color:#8a93a2;margin-bottom:6px;">📅 תאריך עברי</div>
          <div style="font-size:22px;font-weight:800;color:${primary};">${escapeHtml(hebrewDate)}</div>
        </div>
      </div>

      <!-- חתימה -->
      <div style="padding:20px 30px 26px;border-top:1px solid #eef0f3;text-align:right;">
        <div style="color:#4b5563;white-space:pre-line;font-size:15px;">${escapeHtml(business.emailSignature)}</div>
        ${
          business.phone || business.address
            ? `<div style="margin-top:10px;font-size:13px;color:#9ca3af;">${[business.phone, business.address]
                .filter(Boolean)
                .map((s) => escapeHtml(String(s)))
                .join(" · ")}</div>`
            : ""
        }
      </div>
    </div>

    <div style="max-width:600px;margin:14px auto 0;text-align:center;color:#b0b6c0;font-size:12px;">
      נשלח באמצעות ${escapeHtml(business.businessName)}
    </div>
  </div>
</body>
</html>`;

  return { subject, html, text };
}

// גוון בהיר מאוד של צבע ה-hex (לרקע התגית)
function hexToTint(hex: string): string {
  const m = hex.replace("#", "");
  if (m.length !== 6) return "#eef2ff";
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  // מערבב עם לבן ~88%
  const mix = (c: number) => Math.round(c * 0.12 + 255 * 0.88);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
