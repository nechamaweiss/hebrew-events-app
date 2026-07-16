import nodemailer from "nodemailer";
import { prisma } from "./db";

export interface SendMailArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  fromEmail?: string;
}

export interface SendMailResult {
  success: boolean;
  simulated: boolean;
  error?: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string; // כתובת השולח האמיתית (חובה שתתאים לחשבון, למשל ב-Gmail)
}

/**
 * טוען הגדרות SMTP. עדיפות: הגדרות ממסך המערכת (DB) → משתני סביבה → אין (מצב הדמיה).
 */
async function loadSmtp(): Promise<SmtpConfig | null> {
  try {
    const s = await prisma.emailSettings.findUnique({ where: { id: 1 } });
    if (s && s.enabled && s.host.trim() && s.username.trim()) {
      return {
        host: s.host.trim(),
        port: s.port,
        secure: s.secure,
        user: s.username.trim(),
        pass: s.password,
        fromEmail: s.username.trim(),
      };
    }
  } catch {
    // אם ה-DB לא זמין, ננסה משתני סביבה
  }

  if (process.env.SMTP_HOST && process.env.SMTP_HOST.trim()) {
    return {
      host: process.env.SMTP_HOST.trim(),
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
      fromEmail: process.env.SMTP_USER || "noreply@example.com",
    };
  }

  return null;
}

function buildTransport(cfg: SmtpConfig): nodemailer.Transporter {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
    // מגבלות זמן כדי שלא ייתקע אם השרת/פורט חסום או פרטים שגויים
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
}

/**
 * שולח מייל. אם אין SMTP מוגדר — עובר ל"מצב הדמיה" (מדפיס לקונסול ומחזיר simulated=true).
 */
export async function sendMail(args: SendMailArgs): Promise<SendMailResult> {
  const cfg = await loadSmtp();
  const fromName = args.fromName || "מערכת התזכורות";

  if (!cfg) {
    console.log("\n📧 [מצב הדמיה — לא נשלח מייל אמיתי]");
    console.log(`   אל: ${args.to}`);
    console.log(`   נושא: ${args.subject}`);
    console.log(`   ${args.text || "(HTML)"}\n`);
    return { success: true, simulated: true };
  }

  // כתובת השולח: משתמשים בכתובת השולח המוגדרת בהגדרות העסק (חייבת להיות שולח מאומת ב-Brevo),
  // ובהיעדרה נופלים לשם המשתמש של ה-SMTP (מתאים ל-Gmail שממילא כותב מחדש את השולח).
  const fromEmail = (args.fromEmail && args.fromEmail.trim()) || cfg.fromEmail;
  const from = `"${fromName}" <${fromEmail}>`;

  try {
    await buildTransport(cfg).sendMail({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      replyTo: fromEmail,
    });
    return { success: true, simulated: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("שגיאת שליחת מייל:", message);
    return { success: false, simulated: false, error: message };
  }
}

/** בודק חיבור SMTP מול ההגדרות הנוכחיות (verify) */
export async function verifySmtp(): Promise<{ ok: boolean; simulated: boolean; error?: string }> {
  const cfg = await loadSmtp();
  if (!cfg) return { ok: false, simulated: true };
  try {
    await buildTransport(cfg).verify();
    return { ok: true, simulated: false };
  } catch (err) {
    return { ok: false, simulated: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function mailerMode(): Promise<"smtp" | "simulation"> {
  return (await loadSmtp()) ? "smtp" : "simulation";
}
