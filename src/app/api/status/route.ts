import { BACKEND_URL } from "@/lib/admin";

/** État de la plateforme (maintenance), relayé depuis le serveur <br/> pour le bandeau du site. */
export async function GET() {
  const response = await fetch(`${BACKEND_URL}/status`, {
    cache: "no-store",
  }).catch(() => null);
  if (!response?.ok) return Response.json({ maintenance: null });
  return Response.json(await response.json());
}
