import type { Metadata } from "next";
import { LegalPage } from "../../_legal/LegalPage";
import { NOTICE } from "../../_legal/notice";

export const metadata: Metadata = {
  title: `${NOTICE.fr.title} · <br/>`,
};

export default function Page() {
  return <LegalPage lang="fr" page="notice" document={NOTICE.fr} />;
}
