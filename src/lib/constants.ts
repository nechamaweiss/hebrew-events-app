// רשימות סגורות המשמשות בכל המערכת

export type EventTypeId =
  | "BIRTHDAY"
  | "ANNIVERSARY"
  | "BAR_MITZVAH"
  | "BAT_MITZVAH"
  | "BRIT"
  | "BRITA"
  | "CHALAKE"
  | "FAMILY_EVENT"
  | "MEMORIAL"
  | "OTHER";

export const EVENT_TYPES: { id: EventTypeId; label: string; genitive: string }[] = [
  { id: "BIRTHDAY", label: "יום הולדת", genitive: "יום ההולדת" },
  { id: "ANNIVERSARY", label: "יום נישואין", genitive: "יום הנישואין" },
  { id: "BAR_MITZVAH", label: "בר מצווה", genitive: "בר המצווה" },
  { id: "BAT_MITZVAH", label: "בת מצווה", genitive: "בת המצווה" },
  { id: "BRIT", label: "ברית", genitive: "הברית" },
  { id: "BRITA", label: "בריתה", genitive: "הבריתה" },
  { id: "CHALAKE", label: "חלאקה", genitive: "החלאקה" },
  { id: "FAMILY_EVENT", label: "אירוע משפחתי", genitive: "האירוע המשפחתי" },
  { id: "MEMORIAL", label: "אזכרה", genitive: "האזכרה" },
  { id: "OTHER", label: "אחר", genitive: "האירוע" },
];

const EVENT_TYPE_EMOJI: Record<string, string> = {
  BIRTHDAY: "🎂",
  ANNIVERSARY: "💍",
  BAR_MITZVAH: "📖",
  BAT_MITZVAH: "🕯️",
  BRIT: "👶",
  BRITA: "👶",
  CHALAKE: "✂️",
  FAMILY_EVENT: "🎉",
  MEMORIAL: "🕯️",
  OTHER: "🗓️",
};

export function eventTypeEmoji(id: string): string {
  return EVENT_TYPE_EMOJI[id] ?? "🎉";
}

export function eventTypeLabel(id: string): string {
  return EVENT_TYPES.find((t) => t.id === id)?.label ?? id;
}
export function eventTypeGenitive(id: string): string {
  return EVENT_TYPES.find((t) => t.id === id)?.genitive ?? "האירוע";
}

// מזהי חודשים עבריים (כולל אדר, אדר א', אדר ב')
export type HebrewMonthId =
  | "TISHREI"
  | "CHESHVAN"
  | "KISLEV"
  | "TEVET"
  | "SHVAT"
  | "ADAR"
  | "ADAR_1"
  | "ADAR_2"
  | "NISAN"
  | "IYAR"
  | "SIVAN"
  | "TAMUZ"
  | "AV"
  | "ELUL";

// מסודר לפי סדר השנה העברית (מתשרי)
export const HEBREW_MONTHS: { id: HebrewMonthId; label: string }[] = [
  { id: "TISHREI", label: "תשרי" },
  { id: "CHESHVAN", label: "חשוון" },
  { id: "KISLEV", label: "כסלו" },
  { id: "TEVET", label: "טבת" },
  { id: "SHVAT", label: "שבט" },
  { id: "ADAR", label: "אדר" },
  { id: "ADAR_1", label: "אדר א׳" },
  { id: "ADAR_2", label: "אדר ב׳" },
  { id: "NISAN", label: "ניסן" },
  { id: "IYAR", label: "אייר" },
  { id: "SIVAN", label: "סיוון" },
  { id: "TAMUZ", label: "תמוז" },
  { id: "AV", label: "אב" },
  { id: "ELUL", label: "אלול" },
];

export function hebrewMonthLabel(id: string): string {
  return HEBREW_MONTHS.find((m) => m.id === id)?.label ?? id;
}

// סוגי תזכורות
export const REMINDER_TYPES: Record<string, { label: string; daysBefore: number; field: string }> = {
  SEVEN_DAYS: { label: "שבוע לפני", daysBefore: 7, field: "sevenDaysBefore" },
  THREE_DAYS: { label: "שלושה ימים לפני", daysBefore: 3, field: "threeDaysBefore" },
  ONE_DAY: { label: "יום לפני", daysBefore: 1, field: "oneDayBefore" },
  SAME_DAY: { label: "ביום האירוע", daysBefore: 0, field: "sameDay" },
};

export function reminderTypeLabel(id: string): string {
  if (id === "TEST") return "מייל ניסיון";
  if (id === "ADMIN_ALERT") return "התראת מנהל";
  return REMINDER_TYPES[id]?.label ?? id;
}
