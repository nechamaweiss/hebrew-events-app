import { EVENT_TYPES, HEBREW_MONTHS } from "./constants";

const VALID_TYPES = new Set(EVENT_TYPES.map((t) => t.id));
const VALID_MONTHS = new Set(HEBREW_MONTHS.map((m) => m.id));

export interface EventBody {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  eventType?: string;
  hebrewDay?: number;
  hebrewMonth?: string;
  hebrewYear?: number | null;
  recurring?: boolean;
  notes?: string;
  image?: string;
  active?: boolean;
  linkedRelativeId?: number | null;
  relationLabel?: string | null;
  reminder?: {
    sevenDaysBefore?: boolean;
    threeDaysBefore?: boolean;
    oneDayBefore?: boolean;
    sameDay?: boolean;
  };
  recipientIds?: number[];
}

/** אימות נתוני אירוע. מחזיר הודעת שגיאה או null אם תקין */
export function validateEvent(b: EventBody): string | null {
  if (!b.firstName?.trim()) return "יש להזין שם פרטי";
  if (!b.lastName?.trim()) return "יש להזין שם משפחה";
  if (!b.eventType || !VALID_TYPES.has(b.eventType as never)) return "סוג אירוע לא תקין";
  if (!b.hebrewMonth || !VALID_MONTHS.has(b.hebrewMonth as never)) return "יש לבחור חודש עברי";
  if (!b.hebrewDay || b.hebrewDay < 1 || b.hebrewDay > 30) return "יום עברי לא תקין (1–30)";
  if (b.recurring === false && !b.hebrewYear) return "לאירוע חד-פעמי יש לציין שנה עברית";
  return null;
}
