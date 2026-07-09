// עטיפה סביב @hebcal/core — כל חישובי הלוח העברי במקום אחד.
import { HDate, months, gematriya } from "@hebcal/core";
import type { HebrewMonthId } from "./constants";

export interface HebrewEventDate {
  hebrewDay: number;
  hebrewMonth: string; // HebrewMonthId
  hebrewYear?: number | null;
  recurring: boolean;
}

/** האם שנה עברית נתונה מעוברת */
export function isLeapYear(year: number): boolean {
  return HDate.isLeapYear(year);
}

/**
 * ממיר מזהה חודש עברי (שלנו) למספר החודש ב-hebcal עבור שנה מסוימת.
 * מטפל באדר / אדר א' / אדר ב' לפי מעוברת או רגילה.
 */
export function resolveMonthNumber(monthId: string, year: number): number {
  const leap = HDate.isLeapYear(year);
  switch (monthId as HebrewMonthId) {
    case "NISAN":
      return months.NISAN;
    case "IYAR":
      return months.IYYAR;
    case "SIVAN":
      return months.SIVAN;
    case "TAMUZ":
      return months.TAMUZ;
    case "AV":
      return months.AV;
    case "ELUL":
      return months.ELUL;
    case "TISHREI":
      return months.TISHREI;
    case "CHESHVAN":
      return months.CHESHVAN;
    case "KISLEV":
      return months.KISLEV;
    case "TEVET":
      return months.TEVET;
    case "SHVAT":
      return months.SHVAT;
    // אדר "רגיל": בשנה מעוברת נהוג להתייחס לאדר ב'
    case "ADAR":
      return leap ? months.ADAR_II : months.ADAR_I;
    // אדר א': בשנה רגילה נופל לאדר היחיד
    case "ADAR_1":
      return months.ADAR_I;
    // אדר ב': בשנה רגילה נופל לאדר היחיד
    case "ADAR_2":
      return leap ? months.ADAR_II : months.ADAR_I;
    default:
      return months.TISHREI;
  }
}

/** מספר הימים בחודש עברי בשנה מסוימת */
export function daysInHebrewMonth(monthId: string, year: number): number {
  const m = resolveMonthNumber(monthId, year);
  return HDate.daysInMonth(m, year);
}

/**
 * מחזיר את התאריך הלועזי (JS Date, חצות מקומית) שבו חל האירוע בשנה עברית נתונה.
 * מטפל בקיצור חודשים (יום 30 בחודש חסר → היום האחרון).
 */
export function eventGregorianForYear(ev: HebrewEventDate, hebrewYear: number): Date {
  const monthNum = resolveMonthNumber(ev.hebrewMonth, hebrewYear);
  const maxDay = HDate.daysInMonth(monthNum, hebrewYear);
  const day = Math.min(ev.hebrewDay, maxDay);
  const hd = new HDate(day, monthNum, hebrewYear);
  const g = hd.greg();
  return new Date(g.getFullYear(), g.getMonth(), g.getDate());
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** התאריך העברי של יום נתון (ברירת מחדל: היום) */
export function todayHebrew(from: Date = new Date()): HDate {
  return new HDate(startOfDay(from));
}

/**
 * המופע הקרוב הבא של האירוע (>= today).
 * לאירוע חד-פעמי מחזיר את התאריך הקבוע (גם אם עבר).
 */
export function nextOccurrence(ev: HebrewEventDate, from: Date = new Date()): Date {
  const today = startOfDay(from);
  if (!ev.recurring && ev.hebrewYear) {
    return eventGregorianForYear(ev, ev.hebrewYear);
  }
  const curYear = new HDate(today).getFullYear();
  for (let i = 0; i <= 2; i++) {
    const d = eventGregorianForYear(ev, curYear + i);
    if (d.getTime() >= today.getTime()) return d;
  }
  return eventGregorianForYear(ev, curYear);
}

/** מספר הימים עד המופע הקרוב (0 = היום) */
export function daysUntilNext(ev: HebrewEventDate, from: Date = new Date()): number {
  const today = startOfDay(from);
  const occ = nextOccurrence(ev, from);
  return Math.round((occ.getTime() - today.getTime()) / 86400000);
}

/** רינדור יום+חודש בעברית עם גימטרייה, למשל: י״ד באלול */
export function renderHebrewDayMonth(day: number, monthId: string, year?: number): string {
  const y = year ?? new HDate().getFullYear();
  const monthNum = resolveMonthNumber(monthId, y);
  const maxDay = HDate.daysInMonth(monthNum, y);
  const d = Math.min(day, maxDay);
  // רינדור: "י״ד באלול" — יום בגימטרייה + שם החודש בעברית
  const dayGematria = gematriya(d);
  return `${dayGematria} ${prefixMonth(monthNameHebrew(monthNum, y))}`;
}

/** מוסיף ב'/באות המתאימה לפני שם החודש */
function prefixMonth(name: string): string {
  return "ב" + name;
}

/** שם חודש עברי לפי מספר hebcal ושנה */
export function monthNameHebrew(monthNum: number, year: number): string {
  const leap = HDate.isLeapYear(year);
  const map: Record<number, string> = {
    [months.NISAN]: "ניסן",
    [months.IYYAR]: "אייר",
    [months.SIVAN]: "סיוון",
    [months.TAMUZ]: "תמוז",
    [months.AV]: "אב",
    [months.ELUL]: "אלול",
    [months.TISHREI]: "תשרי",
    [months.CHESHVAN]: "חשוון",
    [months.KISLEV]: "כסלו",
    [months.TEVET]: "טבת",
    [months.SHVAT]: "שבט",
  };
  if (map[monthNum]) return map[monthNum];
  // אדר
  if (monthNum === months.ADAR_I) return leap ? "אדר א׳" : "אדר";
  if (monthNum === months.ADAR_II) return "אדר ב׳";
  return String(monthNum);
}

/** ממיר מספר חודש hebcal חזרה למזהה החודש שלנו (HebrewMonthId) לפי השנה */
export function monthNumToId(monthNum: number, year: number): string {
  const leap = HDate.isLeapYear(year);
  const map: Record<number, string> = {
    [months.NISAN]: "NISAN",
    [months.IYYAR]: "IYAR",
    [months.SIVAN]: "SIVAN",
    [months.TAMUZ]: "TAMUZ",
    [months.AV]: "AV",
    [months.ELUL]: "ELUL",
    [months.TISHREI]: "TISHREI",
    [months.CHESHVAN]: "CHESHVAN",
    [months.KISLEV]: "KISLEV",
    [months.TEVET]: "TEVET",
    [months.SHVAT]: "SHVAT",
    [months.ADAR_II]: "ADAR_2",
  };
  if (map[monthNum]) return map[monthNum];
  // חודש 12: בשנה מעוברת = אדר א', בשנה רגילה = אדר
  if (monthNum === months.ADAR_I) return leap ? "ADAR_1" : "ADAR";
  return "TISHREI";
}

/** רינדור שנה עברית בגימטרייה, למשל תשפ״ה */
export function renderHebrewYear(year: number): string {
  return gematriya(year);
}

/** מפתח ייחודי לתאריך עברי (למניעת שליחת תזכורת כפולה) */
export function hebrewDateKey(from: Date = new Date()): string {
  const hd = new HDate(startOfDay(from));
  return `${hd.getFullYear()}-${hd.getMonth()}-${hd.getDate()}`;
}

/** רשימת החודשים הקיימים בפועל בשנה עברית נתונה (לתצוגת לוח) */
export function monthsSequenceForYear(year: number): { monthNum: number; name: string }[] {
  const total = HDate.monthsInYear(year); // 12 או 13
  const seq: { monthNum: number; name: string }[] = [];
  // סדר השנה מתחיל בתשרי (7) ... עד אלול (6)
  const order = [
    months.TISHREI,
    months.CHESHVAN,
    months.KISLEV,
    months.TEVET,
    months.SHVAT,
    months.ADAR_I,
    ...(total === 13 ? [months.ADAR_II] : []),
    months.NISAN,
    months.IYYAR,
    months.SIVAN,
    months.TAMUZ,
    months.AV,
    months.ELUL,
  ];
  for (const m of order) {
    seq.push({ monthNum: m, name: monthNameHebrew(m, year) });
  }
  return seq;
}

/** מספר ימים בחודש (לפי מספר hebcal) */
export function daysInMonthNum(monthNum: number, year: number): number {
  return HDate.daysInMonth(monthNum, year);
}

/** יום בשבוע (0=ראשון) של תאריך עברי נתון */
export function hebrewDayOfWeek(day: number, monthNum: number, year: number): number {
  const hd = new HDate(day, monthNum, year);
  return hd.greg().getDay();
}

export { HDate, gematriya };
