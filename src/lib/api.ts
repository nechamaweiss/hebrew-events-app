import { NextResponse } from "next/server";
import { getSession } from "./auth";

/** מוודא שהמנהל מחובר; מחזיר null אם כן, או תגובת 401 אם לא */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
  }
  return null;
}

export function ok(data: unknown = { ok: true }) {
  return NextResponse.json(data);
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
