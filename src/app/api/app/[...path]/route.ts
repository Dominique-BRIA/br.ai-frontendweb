import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { memberBackend, SESSION_COOKIE, unreachable } from "@/lib/app";

/** Ces routes ont leur propre relais (connexion) ou ne concernent pas les membres. */
const RESERVED = new Set(["admin", "admin-auth", "auth", "github"]);

/**
 * Relais de la plateforme web vers le serveur <br/> : la session, gardée dans un cookie réservé
 * au serveur du site, est ajoutée ici et ne passe jamais par la page.
 */
async function relay(
  request: NextRequest,
  ctx: RouteContext<"/api/app/[...path]">,
) {
  const { path } = await ctx.params;
  if (RESERVED.has(path[0] ?? "")) {
    return Response.json({ code: "not_found" }, { status: 404 });
  }
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token)
    return Response.json({ code: "unauthenticated" }, { status: 401 });
  // Un fichier envoyé passe tel quel, avec son nom et son type ; le reste est du JSON.
  const binary =
    request.headers.get("Content-Type") === "application/octet-stream";
  const forwarded: Record<string, string> = {};
  if (binary) {
    forwarded["Content-Type"] = "application/octet-stream";
    for (const name of ["x-file-name", "x-file-type"]) {
      const value = request.headers.get(name);
      if (value) forwarded[name] = value;
    }
  }
  const body =
    request.method === "GET"
      ? undefined
      : binary
        ? await request.arrayBuffer()
        : (await request.text()) || undefined;
  const response = await memberBackend(
    `${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`,
    token,
    { method: request.method, body, headers: forwarded },
  ).catch(() => null);
  if (!response) return unreachable();
  // Les pièces jointes gardent leur nom et leurs protections en passant par le relais.
  const headers = new Headers({
    "Content-Type": response.headers.get("Content-Type") ?? "application/json",
  });
  for (const name of [
    "Content-Disposition",
    "Cache-Control",
    "X-Content-Type-Options",
  ]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(response.body, { status: response.status, headers });
}

export {
  relay as DELETE,
  relay as GET,
  relay as PATCH,
  relay as POST,
  relay as PUT,
};
