"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Data {
  enabled: boolean;
  provider: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  hasPassword: boolean;
}

const PRESETS: Record<string, { host: string; port: number; secure: boolean; label: string }> = {
  gmail: { host: "smtp.gmail.com", port: 587, secure: false, label: "Gmail (חינם, מומלץ)" },
  brevo: { host: "smtp-relay.brevo.com", port: 587, secure: false, label: "Brevo / Sendinblue (חינם)" },
  outlook: { host: "smtp-mail.outlook.com", port: 587, secure: false, label: "Outlook / Hotmail" },
  custom: { host: "", port: 587, secure: false, label: "מותאם אישית" },
};

export default function EmailSettingsForm({ initial }: { initial: Data }) {
  const router = useRouter();
  const [data, setData] = useState<Data>(initial);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  function set<K extends keyof Data>(k: K, v: Data[K]) {
    setData((d) => ({ ...d, [k]: v }));
  }

  function changeProvider(p: string) {
    const preset = PRESETS[p];
    setData((d) => ({ ...d, provider: p, host: preset.host || d.host, port: preset.port, secure: preset.secure }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    setError("");
    try {
      const res = await fetch("/api/settings/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, password }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "שגיאה בשמירה");
        return;
      }
      setMsg("ההגדרות נשמרו.");
      if (password) set("hasPassword", true);
      setPassword("");
      router.refresh();
    } catch {
      setError("שגיאת רשת");
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    setTesting(true);
    setMsg("");
    setError("");
    try {
      const res = await fetch("/api/settings/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = await res.json();
      if (!res.ok) setError(body.error || "הבדיקה נכשלה");
      else setMsg(body.message);
    } catch {
      setError("שגיאת רשת");
    } finally {
      setTesting(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="card space-y-4">
        <label className="flex cursor-pointer items-center gap-3 rounded-lg p-3" style={{ border: "1px solid var(--border-color)" }}>
          <input type="checkbox" checked={data.enabled} onChange={(e) => set("enabled", e.target.checked)} className="h-5 w-5" />
          <span>
            <span className="font-medium">הפעל שליחת מיילים אמיתית</span>
            <span className="block text-xs muted">כשכבוי — המערכת פועלת ב"מצב הדמיה" (מיילים מתועדים בלוג בלבד)</span>
          </span>
        </label>

        <div>
          <label className="label">ספק שירות</label>
          <select className="select" value={data.provider} onChange={(e) => changeProvider(e.target.value)}>
            {Object.entries(PRESETS).map(([id, p]) => (
              <option key={id} value={id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="label">כתובת שרת (host)</label>
            <input className="input" value={data.host} onChange={(e) => set("host", e.target.value)} dir="ltr" />
          </div>
          <div>
            <label className="label">פורט</label>
            <input type="number" className="input" value={data.port} onChange={(e) => set("port", Number(e.target.value))} dir="ltr" />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={data.secure} onChange={(e) => set("secure", e.target.checked)} className="h-4 w-4" />
          <span className="text-sm">חיבור מאובטח SSL (סמן עבור פורט 465)</span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">שם משתמש (כתובת המייל שלך)</label>
            <input className="input" value={data.username} onChange={(e) => set("username", e.target.value)} dir="ltr" placeholder="you@gmail.com" />
          </div>
          <div>
            <label className="label">סיסמת אפליקציה / מפתח SMTP</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="ltr"
              placeholder={data.hasPassword ? "•••••••• (שמורה — השאר ריק כדי לא לשנות)" : "הדבק כאן"}
            />
          </div>
        </div>
      </div>

      {/* הוראות Gmail */}
      <div className="card">
        <button type="button" className="flex w-full items-center justify-between text-right" onClick={() => setShowGuide(!showGuide)}>
          <span className="font-bold heading">📖 איך משיגים סיסמת אפליקציה חינמית ב-Gmail?</span>
          <span className="muted">{showGuide ? "▲" : "▼"}</span>
        </button>
        {showGuide && (
          <ol className="mt-4 list-decimal space-y-2 pr-5 text-sm" style={{ color: "var(--color-text)" }}>
            <li>היכנס לחשבון Google שלך → הגדרות → אבטחה.</li>
            <li>הפעל <strong>אימות דו-שלבי</strong> (2-Step Verification) — חובה כדי ליצור סיסמת אפליקציה.</li>
            <li>
              גש לכתובת{" "}
              <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="link">
                myaccount.google.com/apppasswords
              </a>
              .
            </li>
            <li>צור סיסמת אפליקציה חדשה (בחר "אחר" ותן שם, למשל "מערכת תזכורות").</li>
            <li>העתק את הקוד בן 16 התווים והדבק אותו בשדה "סיסמת אפליקציה" למעלה.</li>
            <li>בשדה "שם משתמש" הזן את כתובת ה-Gmail המלאה. שמור → שלח מייל בדיקה.</li>
          </ol>
        )}
      </div>

      {msg && <p className="text-sm" style={{ color: "var(--color-primary)" }}>{msg}</p>}
      {error && <p className="text-sm" style={{ color: "var(--color-alert)" }}>{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn" disabled={saving}>
          {saving ? "שומר..." : "שמור הגדרות"}
        </button>
        <button type="button" className="btn-ghost" onClick={sendTest} disabled={testing}>
          {testing ? "שולח..." : "📨 שלח מייל בדיקה"}
        </button>
      </div>
    </form>
  );
}
