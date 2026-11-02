import { BACKEND_URL } from "@/lib/admin";

const MESSAGES = {
  fr: {
    missing: "Adresse e-mail requise.",
    unreachable: "Le serveur <br/> ne répond pas. Réessayez dans un instant.",
    invalid: "Cette adresse e-mail n'est pas valable.",
    tooMany: "Trop de demandes. Réessayez dans une heure.",
    failed: "La demande n'a pas pu être envoyée.",
  },
  en: {
    missing: "An email address is required.",
    unreachable:
      "The <br/> server is not responding. Please try again in a moment.",
    invalid: "This email address is not valid.",
    tooMany: "Too many requests. Please try again in an hour.",
    failed: "Your request could not be sent.",
  },
};

/** Demande d'accès à la bêta, relayée vers le serveur <br/> depuis la page d'accueil. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: unknown;
    lang?: unknown;
  };
  const t = MESSAGES[body.lang === "en" ? "en" : "fr"];
  if (typeof body.email !== "string") {
    return Response.json({ error: t.missing }, { status: 400 });
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
  if (!response)
    return Response.json({ error: t.unreachable }, { status: 502 });
  if (response.ok) return Response.json({ ok: true });
  const json = (await response.json().catch(() => ({}))) as {
    error?: { code?: string };
  };
  const error =
    json.error?.code === "invalid_request"
      ? t.invalid
      : json.error?.code === "too_many_requests"
        ? t.tooMany
        : t.failed;
  return Response.json({ error }, { status: response.status });
}
