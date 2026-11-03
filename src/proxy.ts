import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/app";

/**
 * Un membre connecté qui revient sur l'accueil va directement sur la plateforme ; sans session,
 * la plateforme renvoie à l'accueil, où l'on se connecte. Ce n'est qu'un aiguillage : le serveur
 * <br/> vérifie la session à chaque appel.
 */
export function proxy(request: NextRequest) {
  const signedIn = request.cookies.has(SESSION_COOKIE);
  const onApp = request.nextUrl.pathname.startsWith("/app");
  if (signedIn && !onApp)
    return NextResponse.redirect(new URL("/app", request.url));
  if (!signedIn && onApp)
    return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/en", "/app/:path*"],
};
