import { NextRequest } from "next/server";
import { runReminders } from "@/lib/reminders";

// נקודת קצה שמופעלת יומית ע"י Vercel Cron (ראה vercel.json).
// מוגנת ע"י CRON_SECRET: Vercel שולח אוטומטית Authorization: Bearer <CRON_SECRET>.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
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
