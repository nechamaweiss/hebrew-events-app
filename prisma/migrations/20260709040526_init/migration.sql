-- CreateTable
CREATE TABLE "Admin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "resetToken" TEXT,
    "resetTokenExpiry" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "nickname" TEXT,
    "eventType" TEXT NOT NULL,
    "hebrewDay" INTEGER NOT NULL,
    "hebrewMonth" TEXT NOT NULL,
    "hebrewYear" INTEGER,
    "recurring" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "image" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "linkedRelativeId" INTEGER,
    "relationLabel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Event_linkedRelativeId_fkey" FOREIGN KEY ("linkedRelativeId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recipient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EventRecipient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eventId" INTEGER NOT NULL,
    "recipientId" INTEGER NOT NULL,
    CONSTRAINT "EventRecipient_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventRecipient_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Recipient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReminderSetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eventId" INTEGER NOT NULL,
    "sevenDaysBefore" BOOLEAN NOT NULL DEFAULT true,
    "threeDaysBefore" BOOLEAN NOT NULL DEFAULT false,
    "oneDayBefore" BOOLEAN NOT NULL DEFAULT true,
    "sameDay" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ReminderSetting_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eventId" INTEGER,
    "recipientId" INTEGER,
    "recipientEmail" TEXT,
    "reminderType" TEXT NOT NULL,
    "hebrewDateKey" TEXT,
    "subject" TEXT,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    CONSTRAINT "EmailLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EmailLog_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Recipient" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BusinessSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "businessName" TEXT NOT NULL DEFAULT 'מערכת התזכורות',
    "logo" TEXT,
    "senderEmail" TEXT NOT NULL DEFAULT 'noreply@example.com',
    "senderName" TEXT NOT NULL DEFAULT 'מערכת התזכורות',
    "phone" TEXT,
    "address" TEXT,
    "emailSignature" TEXT NOT NULL DEFAULT 'בברכה,
מערכת התזכורות',
    "description" TEXT
);

-- CreateTable
CREATE TABLE "ThemeSettings" (
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
    "mode" TEXT NOT NULL DEFAULT 'light'
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EventRecipient_eventId_recipientId_key" ON "EventRecipient"("eventId", "recipientId");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderSetting_eventId_key" ON "ReminderSetting"("eventId");

-- CreateIndex
CREATE INDEX "EmailLog_eventId_recipientId_reminderType_hebrewDateKey_idx" ON "EmailLog"("eventId", "recipientId", "reminderType", "hebrewDateKey");
