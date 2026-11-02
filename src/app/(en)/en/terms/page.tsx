import type { Metadata } from "next";
import { LegalPage } from "../../../_legal/LegalPage";
import { TERMS } from "../../../_legal/terms";

export const metadata: Metadata = {
  title: `${TERMS.en.title} · <br/>`,
};

export default function Page() {
  return <LegalPage lang="en" page="terms" document={TERMS.en} />;
}
