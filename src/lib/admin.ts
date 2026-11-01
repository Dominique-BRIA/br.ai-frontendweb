/** Adresse du serveur <br>.ia, vue depuis le serveur du site. */
export const BACKEND_URL = (
  process.env.BRIA_API_URL ?? "http://127.0.0.1:4000"
).replace(/\/+$/, "");

/**
 * Cookie qui garde le jeton d'administration. Il est réservé au serveur du site (httpOnly) :
 * le JavaScript de la page n'y a jamais accès.
 */
export const ADMIN_COOKIE = "bria_admin";

/** Appelle une route /admin du serveur <br>.ia avec le jeton d'administration. */
export function backendAdmin(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${BACKEND_URL}/admin/${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      "x-admin-token": token,
    },
    cache: "no-store",
  });
}
