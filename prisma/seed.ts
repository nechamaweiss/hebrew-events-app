import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "Admin1234!";
  const passwordHash = await bcrypt.hash(password, 10);

  // מנהל ראשוני
  await prisma.admin.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });
  console.log(`✓ מנהל: ${email}`);

  // הגדרות עסק (סינגלטון)
  await prisma.businessSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      businessName: "מערכת התזכורות המשפחתית",
      senderEmail: "noreply@example.com",
      senderName: "מערכת התזכורות",
      emailSignature: "בברכה,\nמערכת התזכורות",
      description: "ניהול אירועים ושמחות משפחתיות לפי הלוח העברי",
    },
  });
  console.log("✓ הגדרות עסק");

  // הגדרות עיצוב (סינגלטון)
  await prisma.themeSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  console.log("✓ הגדרות עיצוב");

  // אירוע לדוגמה (כמו באיפיון) — רק אם אין אירועים
  const count = await prisma.event.count();
  if (count === 0) {
    const recipient = await prisma.recipient.create({
      data: { name: "משפחת כהן", email: "family@example.com", active: true },
    });

    const event = await prisma.event.create({
      data: {
        firstName: "ישראל",
        lastName: "כהן",
        eventType: "BIRTHDAY",
        hebrewDay: 14,
        hebrewMonth: "ELUL",
        recurring: true,
        active: true,
        notes: "אירוע לדוגמה שנוצר אוטומטית",
        reminderSetting: {
          create: {
            sevenDaysBefore: true,
            threeDaysBefore: true,
            oneDayBefore: true,
            sameDay: true,
          },
        },
        eventRecipients: {
          create: { recipientId: recipient.id },
        },
      },
    });
    console.log(`✓ אירוע לדוגמה: ${event.firstName} ${event.lastName}`);
  }

  console.log("\n🎉 הזריעה הושלמה בהצלחה");
  console.log(`\nכניסה למערכת:\n  אימייל: ${email}\n  סיסמה: ${password}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
