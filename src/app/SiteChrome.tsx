import { Languages } from "lucide-react";
import Link from "next/link";
import { type Lang, type PageKey, ROUTES, TEXTS } from "./i18n";
import { Emblem } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

/** Lien vers la même page dans l'autre langue. */
function LanguageSwitch({ lang, page }: { lang: Lang; page: PageKey }) {
  const other: Lang = lang === "fr" ? "en" : "fr";
  const t = TEXTS[lang].footer;
  return (
    <Link
      href={ROUTES[page][other]}
      hrefLang={other}
      lang={other}
      title={t.switchTitle}
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-card px-4 text-sm font-semibold text-foreground shadow-sm ring-1 ring-border transition-colors hover:text-accent"
    >
      <Languages className="h-4 w-4 text-accent" aria-hidden="true" />
      {t.switchLabel}
    </Link>
  );
}

/** En-tête des pages publiques : l'emblème (retour à l'accueil), la langue et le thème. */
export function SiteHeader({ lang, page }: { lang: Lang; page: PageKey }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <Link href={ROUTES.home[lang]} className="flex items-center gap-2">
        <Emblem className="h-11 w-11" />
        <span className="font-mono text-2xl font-semibold">{"<br/>"}</span>
      </Link>
      <div className="flex items-center gap-2">
        <LanguageSwitch lang={lang} page={page} />
        <ThemeToggle withLabel lang={lang} />
      </div>
    </header>
  );
}

/** Pied des pages publiques : les pages légales. */
export function SiteFooter({ lang }: { lang: Lang }) {
  const t = TEXTS[lang].footer;
  const links = [
    { href: ROUTES.notice[lang], label: t.notice },
    { href: ROUTES.privacy[lang], label: t.privacy },
    { href: ROUTES.terms[lang], label: t.terms },
  ];
  return (
    <footer className="flex flex-col items-center justify-between gap-3 border-t border-border pt-5 text-sm text-muted sm:flex-row">
      <span className="font-mono">{"<br/>"} · 2026</span>
      <nav
        aria-label={t.notice}
        className="flex flex-wrap justify-center gap-x-5 gap-y-1"
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="hover:text-foreground hover:underline"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
