import { NextRequest } from "next/server";
import { requireAdmin, ok } from "@/lib/api";
import { runReminders } from "@/lib/reminders";

// הפעלה ידנית של מנוע התזכורות (לבדיקה). אפשר לשלוח {date:"2025-08-30"}
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const b = await req.json().catch(() => ({}));
  const date = b.date ? new Date(b.date + "T08:00:00") : new Date();
  const result = await runReminders(date);
  return ok(result);
}
