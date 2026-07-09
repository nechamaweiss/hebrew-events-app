"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HEBREW_MONTHS, REMINDER_TYPES } from "@/lib/constants";
import { computeMilestones, Gender, MilestoneId } from "@/lib/milestones";

interface RecipientLite {
  id: number;
  name: string;
  email: string;
}

const ALL_MILESTONES: { id: MilestoneId; label: string; maleOnly: boolean }[] = [
  { id: "BIRTHDAY", label: "יום הולדת שנתי", maleOnly: false },
  { id: "BRIT", label: "ברית (יום 8)", maleOnly: true },
  { id: "CHALAKE", label: "חלאקה (גיל 3)", maleOnly: true },
  { id: "MITZVAH", label: "בר / בת מצווה", maleOnly: false },
];

export default function BirthDateForm({ recipients }: { recipients: RecipientLite[] }) {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [birthDay, setBirthDay] = useState(1);
  const [birthMonth, setBirthMonth] = useState("TISHREI");
  const [birthYear, setBirthYear] = useState(5785);
  const [selected, setSelected] = useState<Set<MilestoneId>>(
    new Set(["BIRTHDAY", "BRIT", "CHALAKE", "MITZVAH"])
  );
  const [recipientIds, setRecipientIds] = useState<number[]>([]);
  const [reminder, setReminder] = useState({
    sevenDaysBefore: true,
    threeDaysBefore: false,
    oneDayBefore: true,
    sameDay: true,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // אבני הדרך הזמינות לפי מין (לבת אין ברית/חלאקה)
  const availableMilestones = ALL_MILESTONES.filter((m) => !(m.maleOnly && gender === "female"));

  function toggleMilestone(id: MilestoneId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleRecipient(id: number) {
    setRecipientIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  // תצוגה מקדימה חיה של האירועים שייווצרו
  const preview = useMemo(() => {
    try {
      return computeMilestones({
        birthDay,
        birthMonth,
        birthYear,
        gender,
        selected: availableMilestones.map((m) => m.id).filter((id) => selected.has(id)),
      });
    } catch {
      return [];
    }
  }, [birthDay, birthMonth, birthYear, gender, selected, availableMilestones]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const milestones = availableMilestones.map((m) => m.id).filter((id) => selected.has(id));
    if (milestones.length === 0) {
      setError("יש לבחור לפחות אבן דרך אחת");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/events/from-birth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          nickname,
          gender,
          birthDay,
          birthMonth,
          birthYear,
          milestones,
          recipientIds,
          reminder,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "שגיאה ביצירה");
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
            <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div>
            <label className="label">שם משפחה *</label>
            <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <div>
            <label className="label">כינוי</label>
            <input className="input" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </div>
        </div>
        <div className="mt-4">
          <label className="label">מין *</label>
          <div className="flex gap-3">
            {[
              { id: "male" as Gender, label: "👦 זכר" },
              { id: "female" as Gender, label: "👧 נקבה" },
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGender(g.id)}
                className="rounded-lg px-5 py-2 text-sm font-medium transition"
                style={{
                  border: gender === g.id ? "2px solid var(--color-primary)" : "1px solid var(--border-color)",
                  background: gender === g.id ? "color-mix(in srgb, var(--color-primary) 10%, transparent)" : "transparent",
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* תאריך לידה עברי */}
      <div className="card">
        <h2 className="mb-4 text-lg font-bold heading">תאריך לידה עברי</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">יום *</label>
            <select className="select" value={birthDay} onChange={(e) => setBirthDay(Number(e.target.value))}>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">חודש *</label>
            <select className="select" value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)}>
              {HEBREW_MONTHS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">שנה עברית *</label>
            <input
              type="number"
              className="input"
              value={birthYear}
              onChange={(e) => setBirthYear(Number(e.target.value))}
              placeholder="5785"
            />
          </div>
        </div>
      </div>

      {/* אבני דרך */}
      <div className="card">
        <h2 className="mb-4 text-lg font-bold heading">אבני דרך ליצירה</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {availableMilestones.map((m) => (
            <label key={m.id} className="flex cursor-pointer items-center gap-2 rounded-lg p-2" style={{ border: "1px solid var(--border-color)" }}>
              <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggleMilestone(m.id)} className="h-4 w-4" />
              <span className="text-sm">{m.label}</span>
            </label>
          ))}
        </div>
        {gender === "female" && (
          <p className="mt-2 text-xs muted">לבת נוצרים יום הולדת ובת מצווה בלבד (ללא ברית וחלאקה).</p>
        )}
      </div>

      {/* תצוגה מקדימה */}
      <div className="card">
        <h2 className="mb-4 text-lg font-bold heading">תצוגה מקדימה — האירועים שייווצרו</h2>
        {preview.length === 0 ? (
          <p className="muted">לא נבחרו אבני דרך.</p>
        ) : (
          <div className="space-y-2">
            {preview.map((s) => (
              <div key={s.milestone} className="flex items-center justify-between rounded-lg p-3" style={{ border: "1px solid var(--border-color)" }}>
                <span className="font-medium">🎉 {s.label}</span>
                <span className="text-sm">
                  {s.hebrewDateText}
                  {s.recurring ? <span className="muted"> · חוזר כל שנה</span> : s.hebrewYear ? <span className="muted"> ({s.hebrewYear})</span> : null}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* תזכורות */}
      <div className="card">
        <h2 className="mb-4 text-lg font-bold heading">תזכורות (יחולו על כל האירועים)</h2>
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
                checked={reminder[field]}
                onChange={(e) => setReminder((r) => ({ ...r, [field]: e.target.checked }))}
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
                <input type="checkbox" checked={recipientIds.includes(r.id)} onChange={() => toggleRecipient(r.id)} className="h-4 w-4" />
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
          {saving ? "יוצר..." : `צור ${preview.length} אירועים`}
        </button>
        <button type="button" className="btn-ghost" onClick={() => router.push("/events")}>
          ביטול
        </button>
      </div>
    </form>
  );
}
