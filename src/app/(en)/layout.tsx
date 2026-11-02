import type { Metadata } from "next";
import { icons, RootDocument } from "../RootDocument";

export const metadata: Metadata = {
  title: "<br/>",
  description:
    "A team chat where AI keeps track of your decisions, settles disagreements and writes the code on your machines.",
  icons,
  alternates: { languages: { fr: "/" } },
};

// Les deux groupes, (fr) et (en), ont chacun leur mise en page racine, à l'adresse « / ».
export default function EnglishLayout({ children }: LayoutProps<"/">) {
  return <RootDocument lang="en">{children}</RootDocument>;
}
