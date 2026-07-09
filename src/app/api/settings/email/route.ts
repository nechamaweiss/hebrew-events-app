import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, ok, bad } from "@/lib/api";

const DEFAULTS = {
  enabled: false,
  provider: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  username: "",
  password: "",
};

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const s = (await prisma.emailSettings.findUnique({ where: { id: 1 } })) || DEFAULTS;
  // לא מחזירים את הסיסמה עצמה — רק אם קיימת
  return ok({
    enabled: s.enabled,
    provider: s.provider,
    host: s.host,
    port: s.port,
    secure: s.secure,
    username: s.username,
    hasPassword: Boolean(s.password),
  });
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const b = await req.json().catch(() => ({}));

  if (b.enabled) {
    if (!b.host?.trim()) return bad("יש להזין כתובת שרת (host)");
    if (!b.username?.trim()) return bad("יש להזין שם משתמש (כתובת המייל)");
  }

  // אם הסיסמה ריקה בבקשה — שומרים את הקיימת (כדי שלא צריך להזין שוב)
  const existing = await prisma.emailSettings.findUnique({ where: { id: 1 } });
  const password = b.password && b.password.length > 0 ? b.password : existing?.password || "";

  if (b.enabled && !password) return bad("יש להזין סיסמת אפליקציה / מפתח SMTP");

  const data = {
    enabled: Boolean(b.enabled),
    provider: b.provider || "gmail",
    host: b.host?.trim() || DEFAULTS.host,
    port: Number(b.port) || 587,
    secure: Boolean(b.secure),
    username: b.username?.trim() || "",
    password,
  };

  await prisma.emailSettings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });

  return ok({ saved: true });
}
