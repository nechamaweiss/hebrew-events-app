"use client";

import { useState } from "react";
import EmailPreviewModal from "./EmailPreviewModal";

export default function PreviewEmailButton({ eventId, label = "👁️ תצוגה מקדימה" }: { eventId: number; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn-ghost text-sm" onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && <EmailPreviewModal eventId={eventId} onClose={() => setOpen(false)} />}
    </>
  );
}
