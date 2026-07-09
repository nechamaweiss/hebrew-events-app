import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, ok, bad } from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const id = Number(params.id);
  const b = await req.json().catch(() => ({}));
  if (!b.name?.trim()) return bad("יש להזין שם");
  if (!b.email?.trim() || !EMAIL_RE.test(b.email)) return bad("כתובת מייל אינה תקינה");

  const recipient = await prisma.recipient.update({
    where: { id },
    data: { name: b.name.trim(), email: b.email.trim(), active: b.active ?? true },
  });
  return ok(recipient);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  await prisma.recipient.delete({ where: { id: Number(params.id) } });
  return ok();
}
