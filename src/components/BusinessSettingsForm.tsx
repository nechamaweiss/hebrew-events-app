"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Data {
  businessName: string;
  logo: string | null;
  senderEmail: string;
  senderName: string;
  phone: string;
  address: string;
  emailSignature: string;
  description: string;
}

export default function BusinessSettingsForm({ initial }: { initial: Data }) {
  const router = useRouter();
  const [data, setData] = useState<Data>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  function set<K extends keyof Data>(k: K, v: Data[K]) {
    setData((d) => ({ ...d, [k]: v }));
  }

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      setError("הלוגו גדול מדי (מקסימום ~500KB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set("logo", reader.result as string);
    reader.readAsDataURL(file);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    setError("");
    try {
      const res = await fetch("/api/settings/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "שגיאה");
        return;
      }
      setMsg("ההגדרות נשמרו בהצלחה");
      router.refresh();
    } catch {
      setError("שגיאת רשת");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">שם העסק *</label>
            <input className="input" value={data.businessName} onChange={(e) => set("businessName", e.target.value)} required />
          </div>
          <div>
            <label className="label">תיאור קצר</label>
            <input className="input" value={data.description} onChange={(e) => set("description", e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="label">לוגו</label>
            <input type="file" accept="image/*" onChange={handleLogo} className="text-sm" />
          </div>
          {data.logo && (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.logo} alt="לוגו" className="h-14 rounded-lg object-contain" />
              <button type="button" className="text-sm link" onClick={() => set("logo", null)}>
                הסר
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="text-lg font-bold heading">פרטי שליחת מיילים</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">שם השולח</label>
            <input className="input" value={data.senderName} onChange={(e) => set("senderName", e.target.value)} />
          </div>
          <div>
            <label className="label">כתובת דוא״ל לשליחה</label>
            <input className="input" type="email" value={data.senderEmail} onChange={(e) => set("senderEmail", e.target.value)} dir="ltr" />
          </div>
          <div>
            <label className="label">טלפון</label>
            <input className="input" value={data.phone} onChange={(e) => set("phone", e.target.value)} dir="ltr" />
          </div>
          <div>
            <label className="label">כתובת</label>
            <input className="input" value={data.address} onChange={(e) => set("address", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">טקסט חתימת המייל</label>
          <textarea className="textarea" rows={3} value={data.emailSignature} onChange={(e) => set("emailSignature", e.target.value)} />
        </div>
      </div>

      {msg && <p className="text-sm" style={{ color: "var(--color-primary)" }}>{msg}</p>}
      {error && <p className="text-sm" style={{ color: "var(--color-alert)" }}>{error}</p>}

      <button type="submit" className="btn" disabled={saving}>
        {saving ? "שומר..." : "שמור הגדרות"}
      </button>
    </form>
  );
}
