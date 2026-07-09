import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, ok, bad } from "@/lib/api";
import { HEBREW_MONTHS } from "@/lib/constants";
import { computeMilestones, Gender, MilestoneId } from "@/lib/milestones";

const VALID_MONTHS = new Set(HEBREW_MONTHS.map((m) => m.id));

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const b = await req.json().catch(() => ({}));

  if (!b.firstName?.trim()) return bad("יש להזין שם פרטי");
  if (!b.lastName?.trim()) return bad("יש להזין שם משפחה");
  if (b.gender !== "male" && b.gender !== "female") return bad("יש לבחור מין");
  if (!b.birthMonth || !VALID_MONTHS.has(b.birthMonth)) return bad("יש לבחור חודש לידה עברי");
  if (!b.birthDay || b.birthDay < 1 || b.birthDay > 30) return bad("יום לידה עברי לא תקין (1–30)");
  if (!b.birthYear || b.birthYear < 5000 || b.birthYear > 6000) return bad("שנת לידה עברית לא תקינה");

  const milestones = (Array.isArray(b.milestones) ? b.milestones : []) as MilestoneId[];
  if (milestones.length === 0) return bad("יש לבחור לפחות אבן דרך אחת");

  const specs = computeMilestones({
    birthDay: b.birthDay,
    birthMonth: b.birthMonth,
    birthYear: b.birthYear,
    gender: b.gender as Gender,
    selected: milestones,
  });

  if (specs.length === 0) return bad("לא נוצרו אירועים עבור המין שנבחר");

  const recipientIds: number[] = Array.isArray(b.recipientIds) ? b.recipientIds : [];
  const reminder = b.reminder || {};
  const reminderData = {
    sevenDaysBefore: reminder.sevenDaysBefore ?? true,
    threeDaysBefore: reminder.threeDaysBefore ?? false,
    oneDayBefore: reminder.oneDayBefore ?? true,
    sameDay: reminder.sameDay ?? true,
  };

  const created = await prisma.$transaction(
    specs.map((s) =>
      prisma.event.create({
        data: {
          firstName: b.firstName.trim(),
          lastName: b.lastName.trim(),
          nickname: b.nickname?.trim() || null,
          eventType: s.eventType,
          hebrewDay: s.hebrewDay,
          hebrewMonth: s.hebrewMonth,
          hebrewYear: s.recurring ? null : s.hebrewYear,
          recurring: s.recurring,
          notes: `נוצר אוטומטית מתאריך לידה (${b.birthDay}/${b.birthMonth}/${b.birthYear})`,
          active: b.active ?? true,
          reminderSetting: { create: reminderData },
          eventRecipients: { create: recipientIds.map((recipientId) => ({ recipientId })) },
        },
      })
    )
  );

  return ok({ count: created.length, events: created });
}
