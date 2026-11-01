/** Adresse du serveur <br/>, vue depuis le serveur du site. */
export const BACKEND_URL = (
  process.env.BRIA_API_URL ?? "http://127.0.0.1:4000"
).replace(/\/+$/, "");

/**
 * Cookie qui garde la session du tableau de bord. Il est réservé au serveur du site
 * (httpOnly) : le JavaScript de la page n'y a jamais accès.
 */
export const ADMIN_COOKIE = "bria_admin";

/** Appelle le serveur <br/> avec la session d'un compte de l'équipe interne. */
export function backend(
  path: string,
  session: string | null,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${BACKEND_URL}/${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(session ? { "x-admin-session": session } : {}),
    },
    cache: "no-store",
  });
}
