import type { Metadata } from "next";
import { LegalPage } from "../../../_legal/LegalPage";
import { NOTICE } from "../../../_legal/notice";

export const metadata: Metadata = {
  title: `${NOTICE.en.title} · <br/>`,
};

export default function Page() {
  return <LegalPage lang="en" page="notice" document={NOTICE.en} />;
}
