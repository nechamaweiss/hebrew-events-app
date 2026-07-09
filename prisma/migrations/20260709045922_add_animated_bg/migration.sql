-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ThemeSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "primary" TEXT NOT NULL DEFAULT '#4f46e5',
    "secondary" TEXT NOT NULL DEFAULT '#0ea5e9',
    "buttonColor" TEXT NOT NULL DEFAULT '#4f46e5',
    "linkColor" TEXT NOT NULL DEFAULT '#2563eb',
    "alertColor" TEXT NOT NULL DEFAULT '#dc2626',
    "headingColor" TEXT NOT NULL DEFAULT '#111827',
    "background" TEXT NOT NULL DEFAULT '#f7f8fa',
    "menuBackground" TEXT NOT NULL DEFAULT '#111827',
    "textColor" TEXT NOT NULL DEFAULT '#1f2937',
    "mode" TEXT NOT NULL DEFAULT 'light',
    "animatedBackground" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_ThemeSettings" ("alertColor", "background", "buttonColor", "headingColor", "id", "linkColor", "menuBackground", "mode", "primary", "secondary", "textColor") SELECT "alertColor", "background", "buttonColor", "headingColor", "id", "linkColor", "menuBackground", "mode", "primary", "secondary", "textColor" FROM "ThemeSettings";
DROP TABLE "ThemeSettings";
ALTER TABLE "new_ThemeSettings" RENAME TO "ThemeSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
