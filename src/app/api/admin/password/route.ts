import { cookies } from "next/headers";
import { ADMIN_COOKIE, backend } from "@/lib/admin";

/** Changement du mot de passe du compte connecté au tableau de bord. */
export async function POST(request: Request) {
  const session = (await cookies()).get(ADMIN_COOKIE)?.value ?? null;
  if (!session)
    return Response.json({ error: "Connexion requise." }, { status: 401 });
  const response = await backend("admin-auth/password", session, {
    method: "POST",
    body: await request.text(),
  }).catch(() => null);
  if (!response)
    return Response.json(
      { error: "Le serveur <br/> ne répond pas." },
      { status: 502 },
    );
  return new Response(response.body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
