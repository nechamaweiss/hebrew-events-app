import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, ok, bad } from "@/lib/api";
import { validateEvent, EventBody } from "@/lib/event-schema";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const id = Number(params.id);
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      reminderSetting: true,
      eventRecipients: { include: { recipient: true } },
      linkedRelative: true,
    },
  });
  if (!event) return bad("אירוע לא נמצא", 404);
  return ok(event);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const id = Number(params.id);
  const b: EventBody = await req.json().catch(() => ({}));
  const err = validateEvent(b);
  if (err) return bad(err);

  // מניעת קישור עצמי
  if (b.linkedRelativeId === id) return bad("לא ניתן לקשר אירוע לעצמו");

  await prisma.event.update({
    where: { id },
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
        upsert: {
          create: {
            sevenDaysBefore: b.reminder?.sevenDaysBefore ?? true,
            threeDaysBefore: b.reminder?.threeDaysBefore ?? false,
            oneDayBefore: b.reminder?.oneDayBefore ?? true,
            sameDay: b.reminder?.sameDay ?? true,
          },
          update: {
            sevenDaysBefore: b.reminder?.sevenDaysBefore ?? true,
            threeDaysBefore: b.reminder?.threeDaysBefore ?? false,
            oneDayBefore: b.reminder?.oneDayBefore ?? true,
            sameDay: b.reminder?.sameDay ?? true,
          },
        },
      },
    },
  });

  // עדכון שיוך נמענים (מחיקה ויצירה מחדש)
  if (Array.isArray(b.recipientIds)) {
    await prisma.eventRecipient.deleteMany({ where: { eventId: id } });
    if (b.recipientIds.length) {
      await prisma.eventRecipient.createMany({
        data: b.recipientIds.map((recipientId) => ({ eventId: id, recipientId })),
      });
    }
  }

  const updated = await prisma.event.findUnique({
    where: { id },
    include: { reminderSetting: true, eventRecipients: true },
  });
  return ok(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const id = Number(params.id);
  await prisma.event.delete({ where: { id } });
  return ok();
}
