"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/", label: "לוח בקרה", icon: "📊" },
  { href: "/events", label: "אירועים", icon: "🎉" },
  { href: "/recipients", label: "מקבלי התראות", icon: "👥" },
  { href: "/calendar", label: "לוח שנה עברי", icon: "🗓️" },
  { href: "/scheduled", label: "מיילים מתוזמנים", icon: "📤" },
  { href: "/logs", label: "לוג מיילים", icon: "📧" },
  { href: "/settings/business", label: "הגדרות העסק", icon: "🏢" },
  { href: "/settings/email", label: "שרת מייל", icon: "📮" },
  { href: "/settings/appearance", label: "עיצוב והתאמה", icon: "🎨" },
];

export default function Sidebar({ businessName }: { businessName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* כפתור תפריט למובייל */}
      <button
        className="fixed top-3 right-3 z-40 rounded-lg p-2 text-white lg:hidden"
        style={{ background: "var(--color-menu-background)" }}
        onClick={() => setOpen(!open)}
        aria-label="תפריט"
      >
        ☰
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-30 flex h-screen w-64 flex-col text-white transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "translate-x-full"
        } lg:static lg:h-auto lg:min-h-screen`}
        style={{ background: "var(--color-menu-background)" }}
      >
        <div className="flex items-center gap-2 border-b border-white/10 p-5">
          <span className="text-2xl">🎉</span>
          <span className="text-lg font-bold">{businessName}</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                isActive(item.href)
                  ? "bg-white/15 font-semibold"
                  : "text-white/80 hover:bg-white/10"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/10"
          >
            <span className="text-lg">🚪</span>
            התנתקות
          </button>
        </div>
      </aside>
    </>
  );
}
