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

interface EmailConfig {
  provider: string; // gmail / brevo / outlook / custom
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
}

/**
 * טוען הגדרות מייל. עדיפות: מסך המערכת (DB) → משתני סביבה → אין (מצב הדמיה).
 */
async function loadConfig(): Promise<EmailConfig | null> {
  try {
    const s = await prisma.emailSettings.findUnique({ where: { id: 1 } });
    if (s && s.enabled && s.host.trim() && s.username.trim()) {
      return {
        provider: s.provider,
        host: s.host.trim(),
        port: s.port,
        secure: s.secure,
        user: s.username.trim(),
        pass: s.password,
        fromEmail: s.username.trim(),
      };
    }
  } catch {
    // נופל למשתני סביבה
  }

  if (process.env.SMTP_HOST && process.env.SMTP_HOST.trim()) {
    return {
      provider: "custom",
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

function buildTransport(cfg: EmailConfig): nodemailer.Transporter {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
}

/**
 * שליחה דרך ה-API של Brevo (HTTPS) — עוקף חסימת פורטי SMTP באחסון חינמי (Render וכו').
 * דורש מפתח API של Brevo (מתחיל ב-xkeysib).
 */
async function sendViaBrevoApi(
  apiKey: string,
  fromName: string,
  fromEmail: string,
  args: SendMailArgs
): Promise<SendMailResult> {
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: args.to }],
        subject: args.subject,
        htmlContent: args.html,
        textContent: args.text || undefined,
      }),
    });
    if (res.ok) return { success: true, simulated: false };
    const body = await res.text();
    return { success: false, simulated: false, error: `Brevo API ${res.status}: ${body.slice(0, 250)}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, simulated: false, error: message };
  }
}

/**
 * שולח מייל. אם אין הגדרות — "מצב הדמיה".
 * ספק Brevo → נשלח דרך ה-API (HTTPS). אחרת → SMTP רגיל.
 */
export async function sendMail(args: SendMailArgs): Promise<SendMailResult> {
  const cfg = await loadConfig();
  const fromName = args.fromName || "מערכת התזכורות";

  if (!cfg) {
    console.log("\n📧 [מצב הדמיה — לא נשלח מייל אמיתי]");
    console.log(`   אל: ${args.to}`);
    console.log(`   נושא: ${args.subject}\n`);
    return { success: true, simulated: true };
  }

  const fromEmail = (args.fromEmail && args.fromEmail.trim()) || cfg.fromEmail;

  // Brevo → API (עוקף חסימת SMTP)
  if (cfg.provider === "brevo") {
    return sendViaBrevoApi(cfg.pass, fromName, fromEmail, args);
  }

  // שאר הספקים → SMTP
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

/** בודק שההגדרות תקינות (חיבור SMTP או מפתח API של Brevo) */
export async function verifySmtp(): Promise<{ ok: boolean; simulated: boolean; error?: string }> {
  const cfg = await loadConfig();
  if (!cfg) return { ok: false, simulated: true };

  if (cfg.provider === "brevo") {
    try {
      const res = await fetch("https://api.brevo.com/v3/account", {
        headers: { "api-key": cfg.pass, accept: "application/json" },
      });
      if (res.ok) return { ok: true, simulated: false };
      const body = await res.text();
      return { ok: false, simulated: false, error: `מפתח ה-API של Brevo אינו תקין (${res.status}). ודאי שהעתקת מפתח מסוג API key (xkeysib) ולא SMTP key.` };
    } catch (err) {
      return { ok: false, simulated: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  try {
    await buildTransport(cfg).verify();
    return { ok: true, simulated: false };
  } catch (err) {
    return { ok: false, simulated: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function mailerMode(): Promise<"smtp" | "simulation"> {
  return (await loadConfig()) ? "smtp" : "simulation";
}
