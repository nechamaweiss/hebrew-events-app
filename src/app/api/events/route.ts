import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, ok, bad } from "@/lib/api";
import { validateEvent, EventBody } from "@/lib/event-schema";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const events = await prisma.event.findMany({
    include: {
      reminderSetting: true,
      eventRecipients: { include: { recipient: true } },
      linkedRelative: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return ok(events);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const b: EventBody = await req.json().catch(() => ({}));
  const err = validateEvent(b);
  if (err) return bad(err);

  const event = await prisma.event.create({
    data: {
      firstName: b.firstName!.trim(),
      lastName: b.lastName!.trim(),
      nickname: b.nickname?.trim() || null,
      eventType: b.eventType!,
      hebrewDay: b.hebrewDay!,
      hebrewMonth: b.hebrewMonth!,
      hebrewYear: b.recurring === false ? b.hebrewYear ?? null : null,
      recurring: b.recurring ?? true,
      notes: b.notes?.trim() || null,
      image: b.image || null,
      active: b.active ?? true,
      linkedRelativeId: b.linkedRelativeId ?? null,
      relationLabel: b.relationLabel?.trim() || null,
      reminderSetting: {
        create: {
          sevenDaysBefore: b.reminder?.sevenDaysBefore ?? true,
          threeDaysBefore: b.reminder?.threeDaysBefore ?? false,
          oneDayBefore: b.reminder?.oneDayBefore ?? true,
          sameDay: b.reminder?.sameDay ?? true,
        },
      },
      eventRecipients: {
        create: (b.recipientIds ?? []).map((recipientId) => ({ recipientId })),
      },
    },
  });

  return ok(event);
}
