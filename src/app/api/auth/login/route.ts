import { NextRequest } from "next/server";
import { authenticate, signToken, setSessionCookie } from "@/lib/auth";
import { ok, bad } from "@/lib/api";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email?.trim();
  const password = body?.password;

  if (!email || !password) return bad("יש להזין אימייל וסיסמה");

  const admin = await authenticate(email, password);
  if (!admin) return bad("אימייל או סיסמה שגויים", 401);

  const token = signToken({ adminId: admin.id, email: admin.email });
  setSessionCookie(token);
  return ok({ email: admin.email });
}
