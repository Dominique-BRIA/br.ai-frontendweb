import type { Metadata } from "next";
import { AppHome } from "./AppHome";

export const metadata: Metadata = { title: "<br/>" };

/** La plateforme web : on y arrive après s'être inscrit ou connecté sur l'accueil. */
export default function AppPage() {
  return <AppHome />;
}
