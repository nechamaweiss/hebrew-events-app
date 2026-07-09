import { prisma } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import { reminderTypeLabel } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const logs = await prisma.emailLog.findMany({
    include: { event: true, recipient: true },
    orderBy: { sentAt: "desc" },
    take: 300,
  });

  return (
    <div>
      <PageHeader title="לוג שליחת מיילים" subtitle={`${logs.length} רשומות אחרונות`} />

      <div className="card">
        {logs.length === 0 ? (
          <p className="py-10 text-center muted">עדיין לא נשלחו מיילים.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr className="text-sm muted">
                  <th className="pb-3">תאריך</th>
                  <th className="pb-3">שעה</th>
                  <th className="pb-3">אירוע</th>
                  <th className="pb-3">נמען</th>
                  <th className="pb-3">סוג תזכורת</th>
                  <th className="pb-3">סטטוס</th>
                  <th className="pb-3">שגיאה</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => {
                  const d = new Date(l.sentAt);
                  const recipientName = l.recipient?.name || l.recipientEmail || "—";
                  const eventName = l.event ? `${l.event.firstName} ${l.event.lastName}` : "—";
                  return (
                    <tr key={l.id} style={{ borderTop: "1px solid var(--border-color)" }}>
                      <td className="py-3">{d.toLocaleDateString("he-IL")}</td>
                      <td className="py-3">{d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="py-3">{eventName}</td>
                      <td className="py-3">{recipientName}</td>
                      <td className="py-3">{reminderTypeLabel(l.reminderType)}</td>
                      <td className="py-3">
                        {l.status === "SUCCESS" ? (
                          <span className="badge badge-green">הצליח</span>
                        ) : (
                          <span className="badge badge-red">נכשל</span>
                        )}
                      </td>
                      <td className="py-3 text-sm muted">{l.errorMessage || ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
