import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { MaintenanceBanner } from "./MaintenanceBanner";
import { themeScript } from "./theme";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "<br/>",
  description:
    "Un chat d'équipe où l'IA note vos décisions, arbitre vos désaccords et écrit le code sur vos machines.",
  // L'icône de l'onglet suit le thème du navigateur : traits bleus sur fond clair, clairs sur fond sombre.
  icons: {
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
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // La classe « dark » est posée avant l'affichage par le script du thème.
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: petit script fixe qui applique le thème avant l'affichage. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <MaintenanceBanner />
        {children}
      </body>
    </html>
  );
}
