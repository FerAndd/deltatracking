"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, passwordMatches } from "@/lib/auth";

export async function login(_prev: string | null, fd: FormData) {
  if (!process.env.ADMIN_PASSWORD) return "Falta configurar ADMIN_PASSWORD en Vercel. Revisa /estado.";
  if ((process.env.SESSION_SECRET?.length ?? 0) < 32) {
    return "SESSION_SECRET en Vercel debe tener 32 caracteres o más. Cámbialo y haz Redeploy. Revisa /estado.";
  }
  const password = String(fd.get("password") ?? "");
  if (!passwordMatches(password)) {
    await new Promise((r) => setTimeout(r, 600)); // frena intentos repetidos
    return "Contraseña incorrecta";
  }
  await createSession();
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
