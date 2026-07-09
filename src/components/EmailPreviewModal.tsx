"use client";

import { useEffect, useState } from "react";
import { REMINDER_TYPES } from "@/lib/constants";

interface EventData {
  firstName: string;
  lastName: string;
  nickname?: string;
  eventType: string;
  hebrewDay: number;
  hebrewMonth: string;
  hebrewYear: number | null;
}

interface PreviewResult {
  subject: string;
  html: string;
  text: string;
  fromName: string;
  fromEmail: string;
}

export default function EmailPreviewModal({
  eventData,
  eventId,
  onClose,
}: {
  eventData?: EventData;
  eventId?: number;
  onClose: () => void;
}) {
  const [reminderType, setReminderType] = useState("SEVEN_DAYS");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/email/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, event: eventData, reminderType }),
        });
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) setError(body.error || "שגיאה בתצוגה");
        else setPreview(body);
      } catch {
        if (!cancelled) setError("שגיאת רשת");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [reminderType, eventId, eventData]);

  async function sendTest() {
    setSending(true);
    setTestMsg("");
    try {
      const res = await fetch("/api/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, event: eventData, reminderType, to: testEmail }),
      });
      const body = await res.json();
      setTestMsg(res.ok ? body.message : body.error || "שגיאה");
    } catch {
      setTestMsg("שגיאת רשת");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4" onClick={onClose}>
      <div className="card my-8 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold heading">תצוגה מקדימה של המייל</h2>
          <button onClick={onClose} className="text-2xl muted" aria-label="סגור">
            ×
          </button>
        </div>

        <div className="mb-4">
          <label className="label">סוג התזכורת</label>
          <select className="select" value={reminderType} onChange={(e) => setReminderType(e.target.value)}>
            {Object.entries(REMINDER_TYPES).map(([id, cfg]) => (
              <option key={id} value={id}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>

        {loading && <p className="py-6 text-center muted">טוען תצוגה...</p>}
        {error && <p className="py-6 text-center" style={{ color: "var(--color-alert)" }}>{error}</p>}

        {preview && !loading && (
          <div>
            <div className="mb-3 space-y-1 rounded-lg p-3 text-sm" style={{ background: "var(--color-background)" }}>
              <div>
                <span className="muted">מאת:</span> {preview.fromName} &lt;{preview.fromEmail}&gt;
              </div>
              <div>
                <span className="muted">נושא:</span> <strong>{preview.subject}</strong>
              </div>
            </div>
            <iframe
              title="תצוגת מייל"
              srcDoc={preview.html}
              className="h-96 w-full rounded-lg"
              style={{ border: "1px solid var(--border-color)" }}
            />
          </div>
        )}

        {/* שליחת הודעת ניסיון */}
        <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--border-color)" }}>
          <label className="label">שליחת הודעת ניסיון</label>
          <div className="flex flex-wrap gap-2">
            <input
              type="email"
              className="input flex-1"
              placeholder="כתובת לבדיקה"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              dir="ltr"
            />
            <button type="button" className="btn" onClick={sendTest} disabled={sending || !testEmail}>
              {sending ? "שולח..." : "שלח הודעת ניסיון"}
            </button>
          </div>
          {testMsg && <p className="mt-2 text-sm" style={{ color: "var(--color-primary)" }}>{testMsg}</p>}
        </div>
      </div>
    </div>
  );
}
