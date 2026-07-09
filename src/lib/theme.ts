import { prisma } from "./db";

export interface ThemeVars {
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

export const DEFAULT_THEME: ThemeVars = {
  primary: "#4f46e5",
  secondary: "#0ea5e9",
  buttonColor: "#4f46e5",
  linkColor: "#2563eb",
  alertColor: "#dc2626",
  headingColor: "#111827",
  background: "#f7f8fa",
  menuBackground: "#111827",
  textColor: "#1f2937",
  mode: "light",
  animatedBackground: false,
};

export async function getTheme(): Promise<ThemeVars> {
  const t = await prisma.themeSettings.findUnique({ where: { id: 1 } });
  return t ? { ...t } : DEFAULT_THEME;
}

/** בונה מחרוזת משתני CSS. במצב כהה מחליף את משטחי הרקע/טקסט לגרסה כהה */
export function buildThemeCss(t: ThemeVars): string {
  const dark = t.mode === "dark";
  const background = dark ? "#0f172a" : t.background;
  const menuBackground = dark ? "#0b1220" : t.menuBackground;
  const text = dark ? "#e5e7eb" : t.textColor;
  const surface = dark ? "#1e293b" : "#ffffff";
  const border = dark ? "#334155" : "#e5e7eb";
  const muted = dark ? "#94a3b8" : "#6b7280";
  const heading = dark ? "#f1f5f9" : t.headingColor;

  return `:root{
  --color-primary:${t.primary};
  --color-secondary:${t.secondary};
  --color-button:${t.buttonColor};
  --color-link:${dark ? "#93c5fd" : t.linkColor};
  --color-alert:${t.alertColor};
  --color-heading:${heading};
  --color-background:${background};
  --color-menu-background:${menuBackground};
  --color-text:${text};
  --surface:${surface};
  --border-color:${border};
  --muted:${muted};
}`;
}
