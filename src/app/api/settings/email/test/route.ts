import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, ok, bad } from "@/lib/api";
import { sendMail, verifySmtp } from "@/lib/mailer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// שולח מייל בדיקה עם ההגדרות השמורות (יש לשמור לפני הבדיקה)
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const b = await req.json().catch(() => ({}));
  const admin = await prisma.admin.findFirst();
  const to = (b.to?.trim() || admin?.email || "").trim();
  if (!to || !EMAIL_RE.test(to)) return bad("כתובת יעד לבדיקה אינה תקינה");

  // בדיקת חיבור ל-SMTP
  const check = await verifySmtp();
  if (check.simulated) {
    return bad("שרת המייל אינו מופעל. סמן 'הפעל שליחה' ושמור את ההגדרות לפני הבדיקה.");
  }
  if (!check.ok) {
    return bad(`החיבור לשרת המייל נכשל: ${check.error}`);
  }

  const business = await prisma.businessSettings.findUnique({ where: { id: 1 } });
  const result = await sendMail({
    to,
    subject: "בדיקת שרת מייל — מערכת התזכורות",
    text: "מייל זה נשלח כדי לוודא ששרת המייל מוגדר כראוי. אם קיבלת אותו — הכל עובד! 🎉",
    html: `<div dir="rtl" style="font-family:Arial;text-align:right;padding:16px;">
      <h2>✅ שרת המייל מוגדר כראוי</h2>
      <p>מייל זה נשלח כדי לוודא שהשליחה עובדת. מעכשיו התזכורות יישלחו אוטומטית.</p>
    </div>`,
    fromName: business?.senderName,
    fromEmail: business?.senderEmail,
  });

  await prisma.emailLog.create({
    data: {
      reminderType: "TEST",
      recipientEmail: to,
      subject: "בדיקת שרת מייל",
      status: result.success ? "SUCCESS" : "FAILED",
      errorMessage: result.error,
    },
  });

  if (!result.success) return bad(result.error || "השליחה נכשלה");
  return ok({ message: `נשלח מייל בדיקה בהצלחה אל ${to} 🎉` });
}
