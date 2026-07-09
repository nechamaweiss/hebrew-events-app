import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, ok } from "@/lib/api";
import { DEFAULT_THEME } from "@/lib/theme";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;
  const theme = await prisma.themeSettings.findUnique({ where: { id: 1 } });
  return ok(theme || DEFAULT_THEME);
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const b = await req.json().catch(() => ({}));
  const data = {
    primary: b.primary || DEFAULT_THEME.primary,
    secondary: b.secondary || DEFAULT_THEME.secondary,
    buttonColor: b.buttonColor || DEFAULT_THEME.buttonColor,
    linkColor: b.linkColor || DEFAULT_THEME.linkColor,
    alertColor: b.alertColor || DEFAULT_THEME.alertColor,
    headingColor: b.headingColor || DEFAULT_THEME.headingColor,
    background: b.background || DEFAULT_THEME.background,
    menuBackground: b.menuBackground || DEFAULT_THEME.menuBackground,
    textColor: b.textColor || DEFAULT_THEME.textColor,
    mode: b.mode === "dark" ? "dark" : "light",
    animatedBackground: Boolean(b.animatedBackground),
  };

  const theme = await prisma.themeSettings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
  return ok(theme);
}
