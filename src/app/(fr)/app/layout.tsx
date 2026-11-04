import { AppShell } from "./AppShell";

/** Toutes les pages de la plateforme partagent son cadre et sa connexion temps réel. */
export default function AppLayout({ children }: LayoutProps<"/app">) {
  return <AppShell>{children}</AppShell>;
}
