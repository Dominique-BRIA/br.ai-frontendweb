import type { Metadata } from "next";
import { LegalPage } from "../../_legal/LegalPage";
import { TERMS } from "../../_legal/terms";

export const metadata: Metadata = {
  title: `${TERMS.fr.title} · <br/>`,
};

export default function Page() {
  return <LegalPage lang="fr" page="terms" document={TERMS.fr} />;
}
