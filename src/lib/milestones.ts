// חישוב אבני דרך אוטומטיות מתאריך לידה עברי.
import { HDate, resolveMonthNumber, monthNumToId, renderHebrewDayMonth } from "./hebcal";
import type { EventTypeId } from "./constants";

export type Gender = "male" | "female";
export type MilestoneId = "BIRTHDAY" | "BRIT" | "CHALAKE" | "MITZVAH";

export interface MilestoneSpec {
  milestone: MilestoneId;
  eventType: EventTypeId;
  label: string; // תיאור קריא
  hebrewDay: number;
  hebrewMonth: string; // HebrewMonthId
  hebrewYear: number | null; // null = חוזר כל שנה
  recurring: boolean;
  hebrewDateText: string; // תאריך עברי מרונדר (לתצוגה מקדימה)
}

export interface BirthInput {
  birthDay: number;
  birthMonth: string; // HebrewMonthId
  birthYear: number;
  gender: Gender;
  selected: MilestoneId[];
}

/**
 * מחזיר את רשימת אבני הדרך שיש ליצור מתאריך הלידה.
 * לוגיקה לפי מין: בן → ברית/חלאקה/בר מצווה. בת → בת מצווה בלבד (ללא ברית/חלאקה).
 */
export function computeMilestones(input: BirthInput): MilestoneSpec[] {
  const { birthDay, birthMonth, birthYear, gender, selected } = input;
  const specs: MilestoneSpec[] = [];
  const isMale = gender === "male";

  const dateText = (day: number, monthId: string, year?: number) =>
    renderHebrewDayMonth(day, monthId, year);

  // יום הולדת שנתי (כולם)
  if (selected.includes("BIRTHDAY")) {
    specs.push({
      milestone: "BIRTHDAY",
      eventType: "BIRTHDAY",
      label: "יום הולדת",
      hebrewDay: birthDay,
      hebrewMonth: birthMonth,
      hebrewYear: null,
      recurring: true,
      hebrewDateText: dateText(birthDay, birthMonth),
    });
  }

  // ברית — יום 8, בנים בלבד
  if (selected.includes("BRIT") && isMale) {
    const monthNum = resolveMonthNumber(birthMonth, birthYear);
    const birthHD = new HDate(birthDay, monthNum, birthYear);
    const britHD = new HDate(birthHD.abs() + 7); // היום ה-8
    const bDay = britHD.getDate();
    const bYear = britHD.getFullYear();
    const bMonthId = monthNumToId(britHD.getMonth(), bYear);
    specs.push({
      milestone: "BRIT",
      eventType: "BRIT",
      label: "ברית (יום 8)",
      hebrewDay: bDay,
      hebrewMonth: bMonthId,
      hebrewYear: bYear,
      recurring: false,
      hebrewDateText: dateText(bDay, bMonthId, bYear),
    });
  }

  // חלאקה — גיל 3, בנים בלבד
  if (selected.includes("CHALAKE") && isMale) {
    const y = birthYear + 3;
    specs.push({
      milestone: "CHALAKE",
      eventType: "CHALAKE",
      label: "חלאקה (גיל 3)",
      hebrewDay: birthDay,
      hebrewMonth: birthMonth,
      hebrewYear: y,
      recurring: false,
      hebrewDateText: dateText(birthDay, birthMonth, y),
    });
  }

  // בר / בת מצווה
  if (selected.includes("MITZVAH")) {
    const y = birthYear + (isMale ? 13 : 12);
    specs.push({
      milestone: "MITZVAH",
      eventType: isMale ? "BAR_MITZVAH" : "BAT_MITZVAH",
      label: isMale ? "בר מצווה (13)" : "בת מצווה (12)",
      hebrewDay: birthDay,
      hebrewMonth: birthMonth,
      hebrewYear: y,
      recurring: false,
      hebrewDateText: dateText(birthDay, birthMonth, y),
    });
  }

  return specs;
}
