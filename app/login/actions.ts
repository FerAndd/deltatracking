"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, passwordMatches } from "@/lib/auth";

export async function login(_prev: string | null, fd: FormData) {
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
