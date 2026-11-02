import type { Lang, PageKey } from "../i18n";
import { SiteFooter, SiteHeader } from "../SiteChrome";
import { LEGAL_UPDATED } from "./publisher";

/** Un paragraphe, ou une liste à puces. */
export type Block = string | { list: string[] };

export interface LegalSection {
  title: string;
  blocks: Block[];
}

export interface LegalDocument {
  title: string;
  intro?: string;
  sections: LegalSection[];
}

const LABELS = {
  fr: {
    updated: "Dernière mise à jour :",
    beta: "<br/> est en bêta privée : ce texte sera complété avant l'ouverture commerciale du service.",
  },
  en: {
    updated: "Last updated:",
    beta: "<br/> is in private beta: this text will be completed before the service opens commercially.",
  },
};

/** Mise en page des pages légales : titre, date, sections lisibles, dans les deux langues. */
export function LegalPage({
  lang,
  page,
  document,
}: {
  lang: Lang;
  page: PageKey;
  document: LegalDocument;
}) {
  const t = LABELS[lang];
  return (
    <div className="flex min-h-screen flex-col px-4 py-5 sm:px-8 lg:px-14">
      <SiteHeader lang={lang} page={page} />
      <main className="mx-auto w-full max-w-3xl flex-1 py-12">
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
          {document.title}
        </h1>
        <p className="mt-3 text-sm text-muted">
          {t.updated} {LEGAL_UPDATED[lang]}
        </p>
        <p className="mt-6 rounded-xl bg-accent-soft px-4 py-3 text-sm">
          {t.beta}
        </p>
        {document.intro && (
          <p className="mt-6 leading-relaxed">{document.intro}</p>
        )}
        {document.sections.map((section) => (
          <section key={section.title} className="mt-10">
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <div className="mt-3 flex flex-col gap-3 leading-relaxed text-foreground/90">
              {section.blocks.map((block) =>
                typeof block === "string" ? (
                  <p key={block}>{block}</p>
                ) : (
                  <ul
                    key={block.list.join("|")}
                    className="flex list-disc flex-col gap-1.5 pl-6"
                  >
                    {block.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ),
              )}
            </div>
          </section>
        ))}
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
