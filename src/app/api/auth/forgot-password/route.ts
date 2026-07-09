import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { ok } from "@/lib/api";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email?.trim();

  // תמיד מחזירים הצלחה (לא חושפים אילו אימיילים קיימים)
  if (email) {
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (admin) {
      const token = crypto.randomBytes(24).toString("hex");
      const expiry = new Date(Date.now() + 1000 * 60 * 60); // שעה
      await prisma.admin.update({
        where: { id: admin.id },
        data: { resetToken: token, resetTokenExpiry: expiry },
      });
      const business = await prisma.businessSettings.findUnique({ where: { id: 1 } });
      const link = `${process.env.APP_URL || "http://localhost:3000"}/login?reset=${token}`;
      await sendMail({
        to: admin.email,
        subject: "שחזור סיסמה — מערכת התזכורות",
        text: `לחידוש הסיסמה, פתח את הקישור:\n${link}\n\nהקישור בתוקף לשעה.`,
        html: `<div dir="rtl" style="text-align:right;font-family:Arial;">לחידוש הסיסמה לחץ על הקישור:<br><a href="${link}">${link}</a><br><br>הקישור בתוקף לשעה.</div>`,
        fromName: business?.senderName,
        fromEmail: business?.senderEmail,
      });
    }
  }

  return ok({ message: "אם הכתובת קיימת, נשלח אליה מייל לשחזור" });
}
