import { BACKEND_URL } from "@/lib/admin";

/**
 * Cookie de la session d'un membre sur le web. Réservé au serveur du site (httpOnly) : le
 * JavaScript de la page n'y a jamais accès.
 */
export const SESSION_COOKIE = "bria_session";
/** Identifiant de ce navigateur, comme celui d'une machine pour l'extension. */
export const BROWSER_COOKIE = "bria_browser";
/** Une session web reste ouverte un an, ou jusqu'à la déconnexion. */
export const SESSION_MAX_AGE = 365 * 24 * 60 * 60;

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

/** L'adresse du visiteur, telle que Vercel la donne. */
export function visitorOf(request: Request): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local"
  );
}

/**
 * Appelle le serveur <br/> au nom d'un membre. Avec `visitor`, le site transmet l'adresse de son
 * visiteur, prouvée par sa clé : le serveur limite ainsi les inscriptions par visiteur.
 */
export function memberBackend(
  path: string,
  token: string | null,
  init: { method?: string; body?: string; visitor?: string } = {},
): Promise<Response> {
  const relayKey = process.env.SITE_RELAY_KEY;
  return fetch(`${BACKEND_URL}/${path}`, {
    method: init.method ?? "GET",
    body: init.body,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.visitor && relayKey
        ? { "x-bria-site-key": relayKey, "x-bria-visitor": init.visitor }
        : {}),
    },
    cache: "no-store",
  });
}

/** Réponse d'erreur du serveur <br/>, ramenée à un code et un message. */
export async function backendError(
  response: Response,
): Promise<{ code: string; message: string }> {
  const json = (await response.json().catch(() => ({}))) as {
    error?: { code?: string; message?: string };
  };
  return {
    code: json.error?.code ?? "failed",
    message: json.error?.message ?? "",
  };
}

export const unreachable = () =>
  Response.json(
    { code: "network", error: "Le serveur <br/> ne répond pas." },
    { status: 502 },
  );
