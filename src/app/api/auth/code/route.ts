import { backendError, memberBackend, unreachable, visitorOf } from "@/lib/app";

/** Première étape de la connexion : le serveur envoie un code à l'adresse saisie. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: unknown };
  if (typeof body.email !== "string") {
    return Response.json({ code: "invalid_request" }, { status: 400 });
  }
  const response = await memberBackend("auth/code", null, {
    method: "POST",
    body: JSON.stringify({ email: body.email }),
    visitor: visitorOf(request),
  }).catch(() => null);
  if (!response) return unreachable();
  if (!response.ok) {
    const { code, message } = await backendError(response);
    return Response.json({ code, error: message }, { status: response.status });
  }
  const json = (await response.json()) as { newAccount: boolean };
  return Response.json({ newAccount: json.newAccount });
}
