import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import type { Lang } from "./i18n";
import { MaintenanceBanner } from "./MaintenanceBanner";
import { themeScript } from "./theme";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Pour les grands titres de la page d'accueil.
const plexSerif = IBM_Plex_Serif({
  variable: "--font-plex-serif",
  subsets: ["latin"],
  weight: ["400"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

/** L'icône de l'onglet suit le thème du navigateur : traits bleus sur fond clair, clairs sur fond sombre. */
export const icons: Metadata["icons"] = {
  icon: [
    {
      url: "/icone-claire.svg",
      type: "image/svg+xml",
      media: "(prefers-color-scheme: light)",
    },
    {
      url: "/icone-sombre.svg",
      type: "image/svg+xml",
      media: "(prefers-color-scheme: dark)",
    },
  ],
};

/**
 * Le document commun aux deux langues : chaque groupe de routes, (fr) et (en), a sa propre
 * mise en page racine pour annoncer la bonne langue dans <html lang>.
 */
export function RootDocument({
  lang,
  children,
}: {
  lang: Lang;
  children: ReactNode;
}) {
  return (
    // La classe « dark » est posée avant l'affichage par le script du thème.
    <html
      lang={lang}
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexSerif.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: petit script fixe qui applique le thème avant l'affichage. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <MaintenanceBanner lang={lang} />
        {children}
      </body>
    </html>
  );
}
