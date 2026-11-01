import { BACKEND_URL } from "@/lib/admin";

/** Demande d'accès à la bêta, relayée vers le serveur <br/> depuis la page d'accueil. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: unknown };
  if (typeof body.email !== "string") {
    return Response.json({ error: "Adresse e-mail requise." }, { status: 400 });
  }
  const response = await fetch(`${BACKEND_URL}/beta-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Le serveur limite les demandes par adresse IP : il lui faut celle du visiteur.
      "X-Forwarded-For": request.headers.get("x-forwarded-for") ?? "",
    },
    body: JSON.stringify({ email: body.email }),
  }).catch(() => null);
  if (!response) {
    return Response.json(
      { error: "Le serveur <br/> ne répond pas. Réessayez dans un instant." },
      { status: 502 },
    );
  }
  if (response.ok) return Response.json({ ok: true });
  const json = (await response.json().catch(() => ({}))) as {
    error?: { code?: string; message?: string };
  };
  const error =
    json.error?.code === "invalid_request"
      ? "Cette adresse e-mail n'est pas valable."
      : (json.error?.message ?? "La demande n'a pas pu être envoyée.");
  return Response.json({ error }, { status: response.status });
}
