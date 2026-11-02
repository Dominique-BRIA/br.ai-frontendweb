import type { Metadata } from "next";
import { LegalPage } from "../../_legal/LegalPage";
import { PRIVACY } from "../../_legal/privacy";

export const metadata: Metadata = {
  title: `${PRIVACY.fr.title} · <br/>`,
};

export default function Page() {
  return <LegalPage lang="fr" page="privacy" document={PRIVACY.fr} />;
}
