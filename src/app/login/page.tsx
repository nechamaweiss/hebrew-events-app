"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [info, setInfo] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "שגיאה בהתחברות");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("שגיאת רשת");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setInfo(data.message || "נשלח מייל לשחזור");
    } catch {
      setError("שגיאת רשת");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: "var(--color-background)" }}
    >
      <div className="card w-full max-w-md">
        <div className="mb-6 text-center">
          <div
            className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
            style={{ background: "var(--color-primary)", color: "#fff" }}
          >
            🎉
          </div>
          <h1 className="text-2xl font-bold heading">מערכת התזכורות</h1>
          <p className="mt-1 text-sm muted">ניהול אירועים משפחתיים לפי הלוח העברי</p>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">אימייל</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                dir="ltr"
              />
            </div>
            <div>
              <label className="label">סיסמה</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm" style={{ color: "var(--color-alert)" }}>{error}</p>}
            <button type="submit" className="btn w-full" disabled={loading}>
              {loading ? "מתחבר..." : "התחברות"}
            </button>
            <button
              type="button"
              className="w-full text-center text-sm link"
              onClick={() => {
                setMode("forgot");
                setError("");
              }}
            >
              שכחתי סיסמה
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgot} className="space-y-4">
            <p className="text-sm muted">הזן את כתובת האימייל שלך לשחזור הסיסמה.</p>
            <div>
              <label className="label">אימייל</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
              />
            </div>
            {info && <p className="text-sm" style={{ color: "var(--color-primary)" }}>{info}</p>}
            {error && <p className="text-sm" style={{ color: "var(--color-alert)" }}>{error}</p>}
            <button type="submit" className="btn w-full" disabled={loading}>
              {loading ? "שולח..." : "שלח קישור לשחזור"}
            </button>
            <button
              type="button"
              className="w-full text-center text-sm link"
              onClick={() => {
                setMode("login");
                setInfo("");
                setError("");
              }}
            >
              חזרה להתחברות
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
