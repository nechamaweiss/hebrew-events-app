"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EVENT_TYPES, HEBREW_MONTHS, REMINDER_TYPES } from "@/lib/constants";
import EmailPreviewModal from "./EmailPreviewModal";

interface RecipientLite {
  id: number;
  name: string;
  email: string;
  active: boolean;
}
interface EventLite {
  id: number;
  firstName: string;
  lastName: string;
}

interface EventFormData {
  id?: number;
  firstName: string;
  lastName: string;
  nickname: string;
  eventType: string;
  hebrewDay: number;
  hebrewMonth: string;
  hebrewYear: number | null;
  recurring: boolean;
  notes: string;
  image: string | null;
  active: boolean;
  linkedRelativeId: number | null;
  relationLabel: string;
  reminder: {
    sevenDaysBefore: boolean;
    threeDaysBefore: boolean;
    oneDayBefore: boolean;
    sameDay: boolean;
  };
  recipientIds: number[];
}

const RELATION_OPTIONS = ["בן", "בת", "נכד", "נכדה", "אח", "אחות", "בן/בת זוג", "הורה", "אחר"];

const CURRENT_HEBREW_YEAR = 5785;

export default function EventForm({
  initial,
  recipients,
  otherEvents,
}: {
  initial?: Partial<EventFormData> & { id?: number };
  recipients: RecipientLite[];
  otherEvents: EventLite[];
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [data, setData] = useState<EventFormData>({
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    nickname: initial?.nickname ?? "",
    eventType: initial?.eventType ?? "BIRTHDAY",
    hebrewDay: initial?.hebrewDay ?? 1,
    hebrewMonth: initial?.hebrewMonth ?? "TISHREI",
    hebrewYear: initial?.hebrewYear ?? null,
    recurring: initial?.recurring ?? true,
    notes: initial?.notes ?? "",
    image: initial?.image ?? null,
    active: initial?.active ?? true,
    linkedRelativeId: initial?.linkedRelativeId ?? null,
    relationLabel: initial?.relationLabel ?? "",
    reminder: {
      sevenDaysBefore: initial?.reminder?.sevenDaysBefore ?? true,
      threeDaysBefore: initial?.reminder?.threeDaysBefore ?? false,
      oneDayBefore: initial?.reminder?.oneDayBefore ?? true,
      sameDay: initial?.reminder?.sameDay ?? true,
    },
    recipientIds: initial?.recipientIds ?? [],
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  function set<K extends keyof EventFormData>(key: K, value: EventFormData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function toggleRecipient(id: number) {
    setData((d) => ({
      ...d,
      recipientIds: d.recipientIds.includes(id)
        ? d.recipientIds.filter((x) => x !== id)
        : [...d.recipientIds, id],
    }));
  }

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      setError("התמונה גדולה מדי (מקסימום ~1.5MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set("image", reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const url = isEdit ? `/api/events/${initial!.id}` : "/api/events";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "שגיאה בשמירה");
        return;
      }
      router.push("/events");
      router.refresh();
    } catch {
      setError("שגיאת רשת");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* פרטי האדם */}
      <div className="card">
        <h2 className="mb-4 text-lg font-bold heading">פרטי האדם</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">שם פרטי *</label>
            <input className="input" value={data.firstName} onChange={(e) => set("firstName", e.target.value)} required />
          </div>
          <div>
            <label className="label">שם משפחה *</label>
            <input className="input" value={data.lastName} onChange={(e) => set("lastName", e.target.value)} required />
          </div>
          <div>
            <label className="label">כינוי</label>
            <input className="input" value={data.nickname} onChange={(e) => set("nickname", e.target.value)} />
          </div>
        </div>

        {/* קשר משפחתי מקושר */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">קרוב משפחה מקושר</label>
            <select
              className="select"
              value={data.linkedRelativeId ?? ""}
              onChange={(e) => set("linkedRelativeId", e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">— ללא —</option>
              {otherEvents
                .filter((o) => o.id !== initial?.id)
                .map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.firstName} {o.lastName}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="label">סוג הקשר</label>
            <select
              className="select"
              value={data.relationLabel}
              onChange={(e) => set("relationLabel", e.target.value)}
              disabled={!data.linkedRelativeId}
            >
              <option value="">— בחר —</option>
              {RELATION_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* סוג ותאריך */}
      <div className="card">
        <h2 className="mb-4 text-lg font-bold heading">סוג האירוע ותאריך עברי</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">סוג האירוע *</label>
            <select className="select" value={data.eventType} onChange={(e) => set("eventType", e.target.value)}>
              {EVENT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={data.recurring}
                onChange={(e) => set("recurring", e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm">אירוע חוזר מדי שנה (בטל לסימון אירוע חד-פעמי)</span>
            </label>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">יום עברי *</label>
            <select className="select" value={data.hebrewDay} onChange={(e) => set("hebrewDay", Number(e.target.value))}>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">חודש עברי *</label>
            <select className="select" value={data.hebrewMonth} onChange={(e) => set("hebrewMonth", e.target.value)}>
              {HEBREW_MONTHS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          {!data.recurring && (
            <div>
              <label className="label">שנה עברית *</label>
              <input
                type="number"
                className="input"
                value={data.hebrewYear ?? CURRENT_HEBREW_YEAR}
                onChange={(e) => set("hebrewYear", Number(e.target.value))}
                placeholder="5785"
              />
            </div>
          )}
        </div>
      </div>

      {/* נתונים נוספים */}
      <div className="card">
        <h2 className="mb-4 text-lg font-bold heading">נתונים נוספים</h2>
        <div>
          <label className="label">הערות</label>
          <textarea className="textarea" rows={3} value={data.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <div>
            <label className="label">תמונה</label>
            <input type="file" accept="image/*" onChange={handleImage} className="text-sm" />
          </div>
          {data.image && (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.image} alt="תצוגה" className="h-16 w-16 rounded-lg object-cover" />
              <button type="button" className="text-sm link" onClick={() => set("image", null)}>
                הסר
              </button>
            </div>
          )}
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={data.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4" />
            <span className="text-sm">פעיל</span>
          </label>
        </div>
      </div>

      {/* תזכורות */}
      <div className="card">
        <h2 className="mb-4 text-lg font-bold heading">תזכורות</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["sevenDaysBefore", "SEVEN_DAYS"],
              ["threeDaysBefore", "THREE_DAYS"],
              ["oneDayBefore", "ONE_DAY"],
              ["sameDay", "SAME_DAY"],
            ] as const
          ).map(([field, typeId]) => (
            <label key={field} className="flex cursor-pointer items-center gap-2 rounded-lg p-2" style={{ border: "1px solid var(--border-color)" }}>
              <input
                type="checkbox"
                checked={data.reminder[field]}
                onChange={(e) => setData((d) => ({ ...d, reminder: { ...d.reminder, [field]: e.target.checked } }))}
                className="h-4 w-4"
              />
              <span className="text-sm">{REMINDER_TYPES[typeId].label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* מקבלי התראות */}
      <div className="card">
        <h2 className="mb-4 text-lg font-bold heading">מקבלי ההתראות</h2>
        {recipients.length === 0 ? (
          <p className="text-sm muted">
            אין נמענים במערכת.{" "}
            <a href="/recipients" className="link">
              הוסף נמענים
            </a>
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {recipients.map((r) => (
              <label key={r.id} className="flex cursor-pointer items-center gap-2 rounded-lg p-2" style={{ border: "1px solid var(--border-color)" }}>
                <input type="checkbox" checked={data.recipientIds.includes(r.id)} onChange={() => toggleRecipient(r.id)} className="h-4 w-4" />
                <span className="text-sm">
                  {r.name} <span className="muted">({r.email})</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ background: "color-mix(in srgb, var(--color-alert) 12%, transparent)", color: "var(--color-alert)" }}>
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn" disabled={saving}>
          {saving ? "שומר..." : isEdit ? "שמור שינויים" : "צור אירוע"}
        </button>
        <button type="button" className="btn-ghost" onClick={() => setShowPreview(true)}>
          👁️ תצוגה מקדימה
        </button>
        <button type="button" className="btn-ghost" onClick={() => router.push("/events")}>
          ביטול
        </button>
      </div>

      {showPreview && (
        <EmailPreviewModal
          eventData={{
            firstName: data.firstName,
            lastName: data.lastName,
            nickname: data.nickname,
            eventType: data.eventType,
            hebrewDay: data.hebrewDay,
            hebrewMonth: data.hebrewMonth,
            hebrewYear: data.hebrewYear,
          }}
          onClose={() => setShowPreview(false)}
        />
      )}
    </form>
  );
}
