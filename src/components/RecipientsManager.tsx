"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Row {
  id: number;
  name: string;
  email: string;
  active: boolean;
  eventCount: number;
}

export default function RecipientsManager({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Row | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function openNew() {
    setEditing(null);
    setName("");
    setEmail("");
    setActive(true);
    setError("");
    setShowForm(true);
  }

  function openEdit(r: Row) {
    setEditing(r);
    setName(r.name);
    setEmail(r.email);
    setActive(r.active);
    setError("");
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = editing ? `/api/recipients/${editing.id}` : "/api/recipients";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, active }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "שגיאה");
        return;
      }
      setShowForm(false);
      router.refresh();
    } catch {
      setError("שגיאת רשת");
    } finally {
      setSaving(false);
    }
  }

  async function remove(r: Row) {
    if (!confirm(`למחוק את הנמען ${r.name}?`)) return;
    const res = await fetch(`/api/recipients/${r.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("שגיאה במחיקה");
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button className="btn" onClick={openNew}>
          + נמען חדש
        </button>
      </div>

      <div className="card">
        {rows.length === 0 ? (
          <p className="py-10 text-center muted">אין נמענים. הוסף נמען חדש כדי לשייך אותו לאירועים.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr className="text-sm muted">
                  <th className="pb-3">שם</th>
                  <th className="pb-3">אימייל</th>
                  <th className="pb-3">אירועים משויכים</th>
                  <th className="pb-3">סטטוס</th>
                  <th className="pb-3">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ borderTop: "1px solid var(--border-color)" }}>
                    <td className="py-3 font-medium">{r.name}</td>
                    <td className="py-3" dir="ltr" style={{ textAlign: "right" }}>
                      {r.email}
                    </td>
                    <td className="py-3">{r.eventCount}</td>
                    <td className="py-3">
                      {r.active ? <span className="badge badge-green">פעיל</span> : <span className="badge badge-gray">לא פעיל</span>}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-3 text-sm">
                        <button className="link" onClick={() => openEdit(r)}>
                          עריכה
                        </button>
                        <button onClick={() => remove(r)} style={{ color: "var(--color-alert)" }}>
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <form className="card w-full max-w-md" onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <h2 className="mb-4 text-lg font-bold heading">{editing ? "עריכת נמען" : "נמען חדש"}</h2>
            <div className="space-y-4">
              <div>
                <label className="label">שם *</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="label">כתובת מייל *</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4" />
                <span className="text-sm">פעיל</span>
              </label>
              {error && <p className="text-sm" style={{ color: "var(--color-alert)" }}>{error}</p>}
            </div>
            <div className="mt-5 flex gap-3">
              <button type="submit" className="btn" disabled={saving}>
                {saving ? "שומר..." : "שמירה"}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
