import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, ok, bad } from "@/lib/api";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;
  const settings = await prisma.businessSettings.findUnique({ where: { id: 1 } });
  return ok(settings);
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const b = await req.json().catch(() => ({}));
  if (!b.businessName?.trim()) return bad("יש להזין שם עסק");

  const settings = await prisma.businessSettings.upsert({
    where: { id: 1 },
    update: {
      businessName: b.businessName.trim(),
      logo: b.logo || null,
      senderEmail: b.senderEmail?.trim() || "noreply@example.com",
      senderName: b.senderName?.trim() || "מערכת התזכורות",
      phone: b.phone?.trim() || null,
      address: b.address?.trim() || null,
      emailSignature: b.emailSignature ?? "בברכה,\nמערכת התזכורות",
      description: b.description?.trim() || null,
    },
    create: {
      id: 1,
      businessName: b.businessName.trim(),
      logo: b.logo || null,
      senderEmail: b.senderEmail?.trim() || "noreply@example.com",
      senderName: b.senderName?.trim() || "מערכת התזכורות",
      phone: b.phone?.trim() || null,
      address: b.address?.trim() || null,
      emailSignature: b.emailSignature ?? "בברכה,\nמערכת התזכורות",
      description: b.description?.trim() || null,
    },
  });
  return ok(settings);
}
