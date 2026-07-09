"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Theme {
  primary: string;
  secondary: string;
  buttonColor: string;
  linkColor: string;
  alertColor: string;
  headingColor: string;
  background: string;
  menuBackground: string;
  textColor: string;
  mode: string;
  animatedBackground: boolean;
}

type ColorKey =
  | "primary"
  | "secondary"
  | "buttonColor"
  | "linkColor"
  | "alertColor"
  | "headingColor"
  | "background"
  | "menuBackground"
  | "textColor";

const FIELDS: { key: ColorKey; label: string }[] = [
  { key: "primary", label: "צבע ראשי" },
  { key: "secondary", label: "צבע משני" },
  { key: "buttonColor", label: "צבע כפתורים" },
  { key: "linkColor", label: "צבע קישורים" },
  { key: "alertColor", label: "צבע התראות" },
  { key: "headingColor", label: "צבע כותרות" },
  { key: "background", label: "צבע רקע כללי" },
  { key: "menuBackground", label: "צבע רקע התפריט" },
  { key: "textColor", label: "צבע הטקסט" },
];

export default function ThemeSettingsForm({ initial }: { initial: Theme }) {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function set<K extends keyof Theme>(k: K, v: Theme[K]) {
    setTheme((t) => ({ ...t, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/settings/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(theme),
      });
      if (res.ok) {
        setMsg("העיצוב נשמר. הצבעים עודכנו בכל המערכת.");
        router.refresh();
      } else {
        setMsg("שגיאה בשמירה");
      }
    } catch {
      setMsg("שגיאת רשת");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      {/* מצב בהיר/כהה */}
      <div className="card">
        <h2 className="mb-3 text-lg font-bold heading">מצב תצוגה</h2>
        <div className="flex gap-3">
          {[
            { id: "light", label: "☀️ מצב בהיר" },
            { id: "dark", label: "🌙 מצב כהה" },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => set("mode", m.id)}
              className="rounded-lg px-4 py-2 text-sm font-medium transition"
              style={{
                border: theme.mode === m.id ? "2px solid var(--color-primary)" : "1px solid var(--border-color)",
                background: theme.mode === m.id ? "color-mix(in srgb, var(--color-primary) 10%, transparent)" : "transparent",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-lg p-3" style={{ border: "1px solid var(--border-color)" }}>
          <input
            type="checkbox"
            checked={theme.animatedBackground}
            onChange={(e) => set("animatedBackground", e.target.checked)}
            className="h-5 w-5"
          />
          <span>
            <span className="font-medium">🌈 רקע מתחלף (אנימציית צבעים)</span>
            <span className="block text-xs muted">גרדיאנט עדין ומונפש המבוסס על צבעי הערכה, חל על כל המערכת</span>
          </span>
        </label>
      </div>

      {/* צבעים */}
      <div className="card">
        <h2 className="mb-4 text-lg font-bold heading">צבעי המערכת</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded"
                  style={{ border: "1px solid var(--border-color)" }}
                />
                <input
                  className="input"
                  value={theme[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* תצוגה מקדימה */}
      <div className="card">
        <h2 className="mb-4 text-lg font-bold heading">תצוגה מקדימה</h2>
        <div className="rounded-xl p-5" style={{ background: theme.background, border: "1px solid var(--border-color)" }}>
          <h3 className="mb-2 text-lg font-bold" style={{ color: theme.headingColor }}>
            כותרת לדוגמה
          </h3>
          <p className="mb-3" style={{ color: theme.textColor }}>
            טקסט רגיל לדוגמה עם{" "}
            <a href="#" onClick={(e) => e.preventDefault()} style={{ color: theme.linkColor }}>
              קישור לדוגמה
            </a>
            .
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg px-4 py-2 text-sm text-white" style={{ background: theme.buttonColor }}>
              כפתור
            </span>
            <span className="rounded-lg px-4 py-2 text-sm text-white" style={{ background: theme.primary }}>
              ראשי
            </span>
            <span className="rounded-lg px-4 py-2 text-sm text-white" style={{ background: theme.secondary }}>
              משני
            </span>
            <span className="rounded-lg px-4 py-2 text-sm text-white" style={{ background: theme.alertColor }}>
              התראה
            </span>
          </div>
        </div>
      </div>

      {msg && <p className="text-sm" style={{ color: "var(--color-primary)" }}>{msg}</p>}

      <button type="submit" className="btn" disabled={saving}>
        {saving ? "שומר..." : "שמור עיצוב"}
      </button>
    </form>
  );
}
