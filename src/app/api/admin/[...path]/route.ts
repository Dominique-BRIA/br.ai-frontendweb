import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, backendAdmin } from "@/lib/admin";

/**
 * Relais du tableau de bord vers les routes /admin du serveur <br/> : le jeton, gardé dans
 * un cookie réservé au serveur du site, est ajouté ici et ne passe jamais par la page.
 */
async function relay(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/[...path]">,
) {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token)
    return Response.json({ error: "Connexion requise." }, { status: 401 });
  const { path } = await ctx.params;
  const body = request.method === "GET" ? undefined : await request.text();
  const response = await backendAdmin(
    `${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`,
    token,
    {
      method: request.method,
      body: body || undefined,
    },
  ).catch(() => null);
  if (!response)
    return Response.json(
      { error: "Le serveur <br/> ne répond pas." },
      { status: 502 },
    );
  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export {
  relay as DELETE,
  relay as GET,
  relay as PATCH,
  relay as POST,
  relay as PUT,
};
