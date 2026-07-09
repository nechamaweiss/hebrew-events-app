"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EVENT_TYPES, HEBREW_MONTHS, eventTypeLabel } from "@/lib/constants";
import EmailPreviewModal from "./EmailPreviewModal";

interface Row {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string | null;
  eventType: string;
  hebrewDay: number;
  hebrewMonth: string;
  hebrewYear: number | null;
  recurring: boolean;
  active: boolean;
  hebrewDate: string;
  recipientCount: number;
  linkedRelativeName: string | null;
  relationLabel: string | null;
}

export default function EventsTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [month, setMonth] = useState("");
  const [status, setStatus] = useState("");
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const name = `${r.firstName} ${r.lastName} ${r.nickname ?? ""}`.toLowerCase();
      if (q && !name.includes(q.toLowerCase())) return false;
      if (type && r.eventType !== type) return false;
      if (month && r.hebrewMonth !== month) return false;
      if (status === "active" && !r.active) return false;
      if (status === "inactive" && r.active) return false;
      return true;
    });
  }, [rows, q, type, month, status]);

  async function handleDelete(id: number, name: string) {
    if (!confirm(`למחוק את האירוע של ${name}? פעולה זו אינה הפיכה.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else alert("שגיאה במחיקה");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      {/* חיפוש וסינון */}
      <div className="card mb-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input className="input" placeholder="חיפוש לפי שם..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">כל הסוגים</option>
            {EVENT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <select className="select" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">כל החודשים</option>
            {HEBREW_MONTHS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">הכל</option>
            <option value="active">פעילים</option>
            <option value="inactive">לא פעילים</option>
          </select>
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <p className="py-10 text-center muted">לא נמצאו אירועים</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr className="text-sm muted">
                  <th className="pb-3">שם</th>
                  <th className="pb-3">סוג</th>
                  <th className="pb-3">תאריך עברי</th>
                  <th className="pb-3">חוזר</th>
                  <th className="pb-3">נמענים</th>
                  <th className="pb-3">סטטוס</th>
                  <th className="pb-3">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} style={{ borderTop: "1px solid var(--border-color)" }}>
                    <td className="py-3">
                      <div className="font-medium">
                        {r.firstName} {r.lastName}
                        {r.nickname ? <span className="muted"> ({r.nickname})</span> : null}
                      </div>
                      {r.linkedRelativeName && (
                        <div className="text-xs muted">
                          {r.relationLabel || "קשור ל"} · {r.linkedRelativeName}
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      <span className="badge badge-gray">{eventTypeLabel(r.eventType)}</span>
                    </td>
                    <td className="py-3">
                      {r.hebrewDate}
                      {!r.recurring && r.hebrewYear ? <span className="muted"> ({r.hebrewYear})</span> : null}
                    </td>
                    <td className="py-3">{r.recurring ? "✓" : <span className="muted">חד-פעמי</span>}</td>
                    <td className="py-3">{r.recipientCount}</td>
                    <td className="py-3">
                      {r.active ? <span className="badge badge-green">פעיל</span> : <span className="badge badge-gray">לא פעיל</span>}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2 text-sm">
                        <Link href={`/events/${r.id}`} className="link">
                          עריכה
                        </Link>
                        <button className="link" onClick={() => setPreviewId(r.id)}>
                          תצוגה
                        </button>
                        <button
                          onClick={() => handleDelete(r.id, `${r.firstName} ${r.lastName}`)}
                          disabled={deleting === r.id}
                          style={{ color: "var(--color-alert)" }}
                        >
                          מחיקה
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {previewId && <EmailPreviewModal eventId={previewId} onClose={() => setPreviewId(null)} />}
    </div>
  );
}
