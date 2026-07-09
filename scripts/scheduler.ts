// מתזמן התזכורות — worker נפרד שרץ במקביל לשרת ה-Next.js.
// הרצה יומית: npm run scheduler   (רץ ברקע ומפעיל את המנוע כל יום ב-08:00)
// הרצה חד-פעמית לבדיקה: npm run scheduler:once   (אפשר להוסיף תאריך: --date=2025-08-30)
import "dotenv/config";
import cron from "node-cron";
import { runReminders } from "../src/lib/reminders";

const args = process.argv.slice(2);
const once = args.includes("--once");
const dateArg = args.find((a) => a.startsWith("--date="))?.split("=")[1];

async function runOnce(date?: Date) {
  const when = date || new Date();
  console.log(`\n⏰ מריץ מנוע תזכורות עבור ${when.toISOString().slice(0, 10)} ...`);
  const res = await runReminders(when);
  console.log(
    `סיכום: נשלחו ${res.sent}, דולגו ${res.skipped}, נכשלו ${res.failed} (תאריך עברי: ${res.hebrewKey})`
  );
  res.details.forEach((d) => console.log("  " + d));
}

async function main() {
  if (once) {
    const date = dateArg ? new Date(dateArg + "T08:00:00") : undefined;
    await runOnce(date);
    process.exit(0);
  }

  // כל יום בשעה 08:00
  console.log("🗓️  מתזמן התזכורות פעיל. ממתין לשעה 08:00 בכל יום...");
  cron.schedule("0 8 * * *", () => {
    runOnce().catch((e) => console.error("שגיאה בהרצת מנוע התזכורות:", e));
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
