import type { Metadata } from "next";
import "./globals.css";
import { getTheme, buildThemeCss } from "@/lib/theme";
import { prisma } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const business = await prisma.businessSettings.findUnique({ where: { id: 1 } });
  return {
    title: business?.businessName || "מערכת התזכורות",
    description: business?.description || "ניהול אירועים משפחתיים לפי הלוח העברי",
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getTheme();
  const css = buildThemeCss(theme);

  return (
    <html lang="he" dir="rtl" className={theme.mode === "dark" ? "dark" : ""}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={theme.animatedBackground ? "bg-animated" : ""}>{children}</body>
    </html>
  );
}
