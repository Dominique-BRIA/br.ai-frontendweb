import type { Metadata } from "next";
import { icons, RootDocument } from "../RootDocument";

export const metadata: Metadata = {
  title: "<br/>",
  description:
    "Un chat d'équipe où l'IA note vos décisions, arbitre vos désaccords et écrit le code sur vos machines.",
  icons,
  alternates: { languages: { en: "/en" } },
};

export default function FrenchLayout({ children }: LayoutProps<"/">) {
  return <RootDocument lang="fr">{children}</RootDocument>;
}
