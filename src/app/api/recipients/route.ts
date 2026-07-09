import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, ok, bad } from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;
  const recipients = await prisma.recipient.findMany({
    include: { _count: { select: { eventRecipients: true } } },
    orderBy: { name: "asc" },
  });
  return ok(recipients);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const b = await req.json().catch(() => ({}));
  if (!b.name?.trim()) return bad("יש להזין שם");
  if (!b.email?.trim() || !EMAIL_RE.test(b.email)) return bad("כתובת מייל אינה תקינה");

  const recipient = await prisma.recipient.create({
    data: { name: b.name.trim(), email: b.email.trim(), active: b.active ?? true },
  });
  return ok(recipient);
}
