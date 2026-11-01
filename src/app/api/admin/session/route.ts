import { cookies } from "next/headers";
import { ADMIN_COOKIE, backendAdmin } from "@/lib/admin";

/** Connexion au tableau de bord : le jeton est vérifié auprès du serveur, puis gardé dans un cookie. */
export async function POST(request: Request) {
  const { token } = (await request.json().catch(() => ({}))) as {
    token?: unknown;
  };
  if (typeof token !== "string" || token.length < 16) {
    return Response.json({ error: "Jeton invalide." }, { status: 400 });
  }
  const check = await backendAdmin("overview", token).catch(() => null);
  if (!check)
    return Response.json(
      { error: "Le serveur <br>.ia ne répond pas." },
      { status: 502 },
    );
  if (!check.ok)
    return Response.json({ error: "Jeton refusé." }, { status: 401 });

  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
  return Response.json({ ok: true });
}

/** Déconnexion du tableau de bord. */
export async function DELETE() {
  (await cookies()).delete(ADMIN_COOKIE);
  return Response.json({ ok: true });
}
