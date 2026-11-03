import { cookies } from "next/headers";
import { memberBackend, SESSION_COOKIE } from "@/lib/app";

/** Ferme la session sur le serveur <br/>, puis oublie le cookie. */
async function signOut() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await memberBackend("auth/logout", token, { method: "POST" }).catch(
      () => null,
    );
  }
  store.delete(SESSION_COOKIE);
}

export async function POST() {
  await signOut();
  return Response.json({ ok: true });
}

/** Session expirée ou révoquée : la plateforme renvoie ici, puis vers l'accueil. */
export async function GET(request: Request) {
  await signOut();
  return Response.redirect(new URL("/", request.url), 303);
}
