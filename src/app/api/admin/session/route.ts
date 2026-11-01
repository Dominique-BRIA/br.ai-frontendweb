import { cookies } from "next/headers";
import { ADMIN_COOKIE, backend } from "@/lib/admin";

const unreachable = () =>
  Response.json({ error: "Le serveur <br/> ne répond pas." }, { status: 502 });

/** Connexion au tableau de bord par adresse et mot de passe ; la session est gardée dans un cookie. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: unknown;
    password?: unknown;
  };
  if (typeof body.email !== "string" || typeof body.password !== "string") {
    return Response.json(
      { error: "Adresse et mot de passe requis." },
      { status: 400 },
    );
  }
  const response = await backend("admin-auth/login", null, {
    method: "POST",
    body: JSON.stringify({ email: body.email, password: body.password }),
  }).catch(() => null);
  if (!response) return unreachable();
  const json = (await response.json().catch(() => ({}))) as {
    token?: string;
    expiresAt?: string;
    admin?: { email: string; name: string };
    error?: { message?: string };
  };
  if (!response.ok || !json.token) {
    return Response.json(
      { error: json.error?.message ?? "Connexion impossible." },
      { status: response.status },
    );
  }

  (await cookies()).set(ADMIN_COOKIE, json.token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: json.expiresAt ? new Date(json.expiresAt) : undefined,
  });
  return Response.json({ admin: json.admin });
}

/** Modifie le profil du compte connecté (nom affiché, adresse). */
export async function PATCH(request: Request) {
  const session = (await cookies()).get(ADMIN_COOKIE)?.value ?? null;
  if (!session)
    return Response.json({ error: "Connexion requise." }, { status: 401 });
  const response = await backend("admin-auth/me", session, {
    method: "PATCH",
    body: await request.text(),
  }).catch(() => null);
  if (!response) return unreachable();
  return new Response(response.body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Le compte connecté : son nom en bas du menu, ses droits pour les sections. */
export async function GET() {
  const session = (await cookies()).get(ADMIN_COOKIE)?.value ?? null;
  if (!session)
    return Response.json({ error: "Connexion requise." }, { status: 401 });
  const response = await backend("admin-auth/me", session).catch(() => null);
  if (!response) return unreachable();
  return new Response(response.body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Déconnexion : la session est révoquée sur le serveur, puis le cookie effacé. */
export async function DELETE() {
  const store = await cookies();
  const session = store.get(ADMIN_COOKIE)?.value ?? null;
  if (session)
    await backend("admin-auth/logout", session, { method: "POST" }).catch(
      () => null,
    );
  store.delete(ADMIN_COOKIE);
  return Response.json({ ok: true });
}
