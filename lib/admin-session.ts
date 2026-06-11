import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE = "octavio_admin";

// Token de sesión: HMAC de un texto fijo firmado con ADMIN_PASSWORD.
// Si cambias la contraseña, todas las sesiones quedan invalidadas.
export function sessionToken(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("Falta ADMIN_PASSWORD");
  return createHmac("sha256", password).update("octavio-admin-v1").digest("hex");
}

export function passwordMatches(input: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(password);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isAuthorized(req: NextRequest): boolean {
  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!cookie || !process.env.ADMIN_PASSWORD) return false;
  const expected = sessionToken();
  if (cookie.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(cookie), Buffer.from(expected));
}
