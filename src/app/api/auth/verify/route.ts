import { cookies } from "next/headers";
import {
  BROWSER_COOKIE,
  backendError,
  memberBackend,
  SESSION_COOKIE,
  sessionCookieOptions,
  unreachable,
} from "@/lib/app";

/** Seconde étape : le code reçu ouvre une session, gardée dans un cookie du site. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: unknown;
    code?: unknown;
    displayName?: unknown;
  };
  if (typeof body.email !== "string" || typeof body.code !== "string") {
    return Response.json({ code: "invalid_request" }, { status: 400 });
  }
  const store = await cookies();
  // Chaque navigateur a son identifiant, comme une machine : sa session se révoque seule.
  const browser =
    store.get(BROWSER_COOKIE)?.value ?? `web-${crypto.randomUUID()}`;
  store.set(BROWSER_COOKIE, browser, sessionCookieOptions);

  const response = await memberBackend("auth/verify", null, {
    method: "POST",
    body: JSON.stringify({
      email: body.email,
      code: body.code,
      machineId: browser,
      displayName:
        typeof body.displayName === "string" && body.displayName.trim()
          ? body.displayName.trim()
          : undefined,
    }),
  }).catch(() => null);
  if (!response) return unreachable();
  if (!response.ok) {
    const { code, message } = await backendError(response);
    return Response.json({ code, error: message }, { status: response.status });
  }
  const json = (await response.json()) as {
    token: string;
    user: { id: string; displayName: string };
  };
  store.set(SESSION_COOKIE, json.token, sessionCookieOptions);
  return Response.json({ user: json.user });
}
