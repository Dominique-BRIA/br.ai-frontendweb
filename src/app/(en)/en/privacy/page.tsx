import type { Metadata } from "next";
import { LegalPage } from "../../../_legal/LegalPage";
import { PRIVACY } from "../../../_legal/privacy";

export const metadata: Metadata = {
  title: `${PRIVACY.en.title} · <br/>`,
};

export default function Page() {
  return <LegalPage lang="en" page="privacy" document={PRIVACY.en} />;
}
