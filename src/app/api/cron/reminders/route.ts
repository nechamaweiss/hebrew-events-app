import { NextRequest } from "next/server";
import { runReminders } from "@/lib/reminders";

// נקודת קצה שמופעלת יומית ע"י Vercel Cron (ראה vercel.json).
// מוגנת ע"י CRON_SECRET: Vercel שולח אוטומטית Authorization: Bearer <CRON_SECRET>.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    // מקבל את הסוד או בכותרת (Vercel Cron) או בפרמטר ?key= (שירותי תזמון חיצוניים כמו cron-job.org)
    const auth = req.headers.get("authorization");
    const keyParam = req.nextUrl.searchParams.get("key");
    const authorized = auth === `Bearer ${secret}` || keyParam === secret;
    if (!authorized) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const result = await runReminders(new Date());
  console.log("Cron reminders:", JSON.stringify(result));
  return Response.json({ ok: true, ...result });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
