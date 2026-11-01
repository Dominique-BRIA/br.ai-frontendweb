import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, backend } from "@/lib/admin";

/**
 * Relais du tableau de bord vers les routes /admin du serveur <br/> : la session, gardée dans
 * un cookie réservé au serveur du site, est ajoutée ici et ne passe jamais par la page.
 */
async function relay(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/[...path]">,
) {
  const session = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!session)
    return Response.json({ error: "Connexion requise." }, { status: 401 });
  const { path } = await ctx.params;
  const body = request.method === "GET" ? undefined : await request.text();
  const response = await backend(
    `admin/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`,
    session,
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
