import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Sidebar from "@/components/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const business = await prisma.businessSettings.findUnique({ where: { id: 1 } });

  return (
    <div className="flex min-h-screen flex-row-reverse lg:flex-row">
      <Sidebar businessName={business?.businessName || "מערכת התזכורות"} />
      <main className="flex-1 p-4 pt-16 lg:p-8 lg:pt-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
