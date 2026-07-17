import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, ok, bad } from "@/lib/api";
import { linkRecipientToAllEvents } from "@/lib/recipients";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ייבוא מרובה של נמענים (מ-Excel). body: { recipients: [{name,email}], linkToAll?: boolean }
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const b = await req.json().catch(() => ({}));
  const rows: { name?: string; email?: string }[] = Array.isArray(b.recipients) ? b.recipients : [];
  if (rows.length === 0) return bad("לא נמצאו רשומות לייבוא");

  // כתובות קיימות (למניעת כפילות)
  const existing = await prisma.recipient.findMany({ select: { email: true } });
  const existingEmails = new Set(existing.map((r) => r.email.toLowerCase()));

  let created = 0;
  let skipped = 0;
  const seen = new Set<string>();

  for (const row of rows) {
    const name = String(row.name || "").trim();
    const email = String(row.email || "").trim();
    if (!name || !EMAIL_RE.test(email)) {
      skipped++;
      continue;
    }
    const key = email.toLowerCase();
    if (existingEmails.has(key) || seen.has(key)) {
      skipped++;
      continue;
    }
    seen.add(key);
    const recipient = await prisma.recipient.create({
      data: { name, email, active: true },
    });
    if (b.linkToAll) await linkRecipientToAllEvents(recipient.id);
    created++;
  }

  return ok({ created, skipped, total: rows.length });
}
