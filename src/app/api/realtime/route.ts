import { cookies } from "next/headers";
import { BACKEND_URL } from "@/lib/admin";
import { memberBackend, SESSION_COOKIE, unreachable } from "@/lib/app";

/**
 * Ticket de connexion temps réel : le serveur du site le demande avec la session du cookie, et la
 * page ouvre la connexion avec, sans jamais voir le jeton de session.
 */
export async function POST() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token)
    return Response.json({ code: "unauthenticated" }, { status: 401 });
  const response = await memberBackend("realtime/ticket", token, {
    method: "POST",
  }).catch(() => null);
  if (!response) return unreachable();
  if (!response.ok) {
    return Response.json(
      { code: "unauthenticated" },
      { status: response.status },
    );
  }
  const { ticket } = (await response.json()) as { ticket: string };
  return Response.json({
    ticket,
    url: `${BACKEND_URL.replace(/^http/, "ws")}/ws`,
  });
}
