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

// ממפה שורת Excel ל-{name,email}: מזהה עמודות לפי כותרת (עברית/אנגלית), אחרת לפי סדר
function mapImportRow(row: Record<string, unknown>): { name: string; email: string } {
  const keys = Object.keys(row);
  const nameKey = keys.find((k) => /שם|name/i.test(k)) || keys[0];
  const emailKey = keys.find((k) => /מייל|אימייל|דוא|e-?mail/i.test(k)) || keys[1];
  return {
    name: String(row[nameKey] ?? "").trim(),
    email: String(row[emailKey] ?? "").trim(),
  };
}

export default function RecipientsManager({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Row | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [active, setActive] = useState(true);
  const [linkToAll, setLinkToAll] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // ייבוא מ-Excel
  const [showImport, setShowImport] = useState(false);
  const [importRows, setImportRows] = useState<{ name: string; email: string }[]>([]);
  const [importLinkToAll, setImportLinkToAll] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [importErr, setImportErr] = useState("");

  function openNew() {
    setEditing(null);
    setName("");
    setEmail("");
    setActive(true);
    setLinkToAll(false);
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
        body: JSON.stringify({ name, email, active, linkToAll: editing ? false : linkToAll }),
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

  // קריאת קובץ Excel/CSV והפקת רשימת נמענים
  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportErr("");
    setImportMsg("");
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const parsed = raw.map(mapImportRow).filter((r) => r.name && r.email);
      if (parsed.length === 0) {
        setImportErr("לא נמצאו שורות תקינות. ודאי שיש עמודות של שם ואימייל.");
      }
      setImportRows(parsed);
    } catch {
      setImportErr("לא ניתן לקרוא את הקובץ. ודאי שזה קובץ Excel/CSV תקין.");
    }
  }

  async function doImport() {
    if (importRows.length === 0) return;
    setImporting(true);
    setImportErr("");
    setImportMsg("");
    try {
      const res = await fetch("/api/recipients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients: importRows, linkToAll: importLinkToAll }),
      });
      const body = await res.json();
      if (!res.ok) {
        setImportErr(body.error || "שגיאה בייבוא");
        return;
      }
      setImportMsg(`יובאו ${body.created} נמענים, דולגו ${body.skipped} (כפולים/לא תקינים).`);
      setImportRows([]);
      router.refresh();
    } catch {
      setImportErr("שגיאת רשת");
    } finally {
      setImporting(false);
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
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <button className="btn-ghost" onClick={() => { setShowImport(true); setImportRows([]); setImportMsg(""); setImportErr(""); }}>
          📥 ייבוא מ-Excel
        </button>
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
              {!editing && (
                <label className="flex cursor-pointer items-center gap-2 rounded-lg p-2" style={{ border: "1px solid var(--border-color)" }}>
                  <input type="checkbox" checked={linkToAll} onChange={(e) => setLinkToAll(e.target.checked)} className="h-4 w-4" />
                  <span className="text-sm">🔗 שייך אוטומטית לכל האירועים</span>
                </label>
              )}
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

      {showImport && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4" onClick={() => setShowImport(false)}>
          <div className="card my-8 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold heading">📥 ייבוא בני משפחה מ-Excel</h2>
              <button onClick={() => setShowImport(false)} className="text-2xl muted" aria-label="סגור">×</button>
            </div>

            <div className="mb-3 rounded-lg p-3 text-sm" style={{ background: "var(--color-background)" }}>
              העלי קובץ <strong>Excel</strong> (או CSV) עם עמודות של <strong>שם</strong> ו<strong>אימייל</strong>.
              המערכת מזהה את העמודות אוטומטית (לפי הכותרות „שם"/„name" ו„אימייל"/„email").
            </div>

            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFile} className="mb-3 text-sm" />

            <label className="mb-3 flex cursor-pointer items-center gap-2 rounded-lg p-2" style={{ border: "1px solid var(--border-color)" }}>
              <input type="checkbox" checked={importLinkToAll} onChange={(e) => setImportLinkToAll(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm">🔗 שייך את כל המיובאים לכל האירועים</span>
            </label>

            {importErr && <p className="mb-2 text-sm" style={{ color: "var(--color-alert)" }}>{importErr}</p>}
            {importMsg && <p className="mb-2 text-sm" style={{ color: "var(--color-primary)" }}>{importMsg}</p>}

            {importRows.length > 0 && (
              <div className="mb-3">
                <div className="mb-1 text-sm muted">נמצאו {importRows.length} נמענים לתצוגה מקדימה:</div>
                <div className="table-wrap max-h-56 overflow-y-auto rounded-lg" style={{ border: "1px solid var(--border-color)" }}>
                  <table>
                    <tbody>
                      {importRows.map((r, i) => (
                        <tr key={i} style={{ borderTop: i ? "1px solid var(--border-color)" : "none" }}>
                          <td className="px-3 py-2 text-sm font-medium">{r.name}</td>
                          <td className="px-3 py-2 text-sm muted" dir="ltr" style={{ textAlign: "right" }}>{r.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" className="btn" onClick={doImport} disabled={importing || importRows.length === 0}>
                {importing ? "מייבא..." : `ייבא ${importRows.length || ""} נמענים`}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setShowImport(false)}>סגור</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
