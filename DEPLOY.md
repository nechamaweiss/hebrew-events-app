# פריסה חינמית ל-Vercel — קישור קבוע + תזכורות אוטומטיות

מדריך צעד-אחר-צעד לפרוס את המערכת לכתובת ציבורית קבועה, בחינם, כולל שליחת תזכורות אוטומטית מדי יום.

**מה נשתמש בו (הכל חינם):**
- **Vercel** — אירוח האתר + הרצת ה-Cron היומי.
- **Neon** — מסד נתונים PostgreSQL בענן (Vercel לא שומר קבצים, לכן לא ניתן להשתמש ב-SQLite בענן).
- **Gmail** — שליחת המיילים (עד ~500 ביום בחינם).

---

## שלב 1 — העלאת הקוד ל-GitHub

1. צור חשבון ב-[github.com](https://github.com) (אם אין).
2. צור מאגר (repository) חדש, למשל `hebrew-events`.
3. בתיקיית הפרויקט הרץ:
   ```bash
   git init
   git add .
   git commit -m "מערכת תזכורות"
   git branch -M main
   git remote add origin https://github.com/USERNAME/hebrew-events.git
   git push -u origin main
   ```
   > הקובץ `.env` **לא** יעלה (הוא ב-.gitignore) — זה תקין ומאובטח.

---

## שלב 2 — יצירת מסד נתונים חינמי ב-Neon

1. היכנס ל-[neon.tech](https://neon.tech) והירשם בחינם (אפשר עם Google).
2. צור פרויקט חדש (Project). בחר אזור קרוב (Europe).
3. במסך הפרויקט לחץ **Connect** והעתק את **Connection String**. זה נראה כך:
   ```
   postgresql://user:password@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
   שמור אותה — נשתמש בה בשלב הבא.

---

## שלב 3 — פריסה ב-Vercel

1. היכנס ל-[vercel.com](https://vercel.com) והירשם עם חשבון GitHub.
2. לחץ **Add New → Project** ובחר את המאגר `hebrew-events`.
3. לפני הלחיצה על **Deploy**, פתח **Environment Variables** והוסף:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | מחרוזת החיבור מ-Neon (שלב 2) |
   | `JWT_SECRET` | מחרוזת אקראית ארוכה (המצא משהו) |
   | `CRON_SECRET` | מחרוזת אקראית ארוכה נוספת |
   | `ADMIN_EMAIL` | כתובת המייל שלך להתחברות |
   | `ADMIN_PASSWORD` | סיסמה חזקה להתחברות |
   | `APP_URL` | כתובת האתר (אפשר להשלים אחרי הפריסה) |

4. לחץ **Deploy**. הבנייה תיצור אוטומטית את הטבלאות במסד (`prisma db push`), תזרע מנהל ראשוני, ותבנה את האתר.
5. בסיום תקבל **קישור קבוע**, למשל `https://hebrew-events.vercel.app` — זהו הקישור שלך! 🎉
6. חזור ל-**Settings → Environment Variables**, עדכן את `APP_URL` לכתובת שקיבלת, ולחץ **Redeploy**.

---

## שלב 4 — התחברות והגדרת המיילים

1. פתח את הקישור והתחבר עם `ADMIN_EMAIL` / `ADMIN_PASSWORD` שהגדרת.
2. עבור ל**הגדרות → שרת מייל**.
3. בחר ספק **Gmail**, הזן את כתובת ה-Gmail שלך, וסיסמת אפליקציה (ההוראות המלאות מופיעות במסך — צריך אימות דו-שלבי ואז ליצור סיסמת אפליקציה ב-[myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
4. סמן **הפעל שליחת מיילים אמיתית**, שמור, ולחץ **שלח מייל בדיקה**. אם הגיע מייל — הכל עובד.

---

## שלב 5 — התזכורות האוטומטיות

- הקובץ `vercel.json` כבר מגדיר **Vercel Cron** שרץ כל יום ומפעיל את `/api/cron/reminders`.
- ה-Cron מוגן ע"י `CRON_SECRET` (Vercel שולח אותו אוטומטית) — לא ניתן להפעיל אותו מבחוץ.
- **שעת ההרצה:** `vercel.json` מוגדר ל-`0 6 * * *` = **06:00 UTC** (≈ 08:00–09:00 שעון ישראל). לשינוי, ערוך את השדה `schedule` (בפורמט cron, לפי UTC).

> הערה: תוכנית ה-Hobby החינמית של Vercel מריצה Cron **פעם ביום**. זה בדיוק מה שנדרש כאן.

---

## עדכונים עתידיים

כל `git push` ל-`main` יפרוס אוטומטית גרסה חדשה. אם שינית את מבנה מסד הנתונים, ודא ש-`prisma/schema.postgres.prisma` מסונכרן עם `prisma/schema.prisma`.

## פיתוח מקומי מול Vercel

הפיתוח המקומי ממשיך לעבוד עם SQLite (`npm run dev`) ללא שינוי. סכימת ה-PostgreSQL (`schema.postgres.prisma`) מופעלת **רק** בבנייה ב-Vercel (סקריפט `vercel-build`).
