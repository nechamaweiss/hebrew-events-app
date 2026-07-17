import { prisma } from "./db";

/** מקשר נמען לכל האירועים הקיימים (מדלג על שיוכים קיימים) */
export async function linkRecipientToAllEvents(recipientId: number) {
  const events = await prisma.event.findMany({ select: { id: true } });
  if (events.length === 0) return;
  const existing = await prisma.eventRecipient.findMany({
    where: { recipientId },
    select: { eventId: true },
  });
  const existingSet = new Set(existing.map((e) => e.eventId));
  const toCreate = events.filter((e) => !existingSet.has(e.id));
  if (toCreate.length === 0) return;
  await prisma.eventRecipient.createMany({
    data: toCreate.map((e) => ({ eventId: e.id, recipientId })),
  });
}
