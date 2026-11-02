import { BetaRequest } from "./BetaRequest";
import { type Lang, TEXTS } from "./i18n";
import { SiteFooter, SiteHeader } from "./SiteChrome";

/**
 * Page d'accueil, en français (/) et en anglais (/en) : la promesse et la demande d'invitation à
 * gauche, l'emblème animé à droite. Chaque mode a sa vidéo, sur le fond qui lui correspond.
 */
export function HomePage({ lang }: { lang: Lang }) {
  const t = TEXTS[lang];
  return (
    <div className="flex min-h-screen flex-col px-4 py-5 sm:px-8 lg:px-14">
      <SiteHeader lang={lang} page="home" />

      <main className="grid flex-1 grid-cols-1 items-center gap-10 py-10 lg:grid-cols-2 lg:gap-16">
        <section className="mx-auto flex w-full min-w-0 max-w-xl flex-col items-center text-center">
          <h1 className="font-serif text-[2.6rem] leading-tight tracking-tight sm:text-6xl">
            {t.title}
          </h1>
          <p className="mt-4 font-serif text-xl text-muted sm:text-2xl">
            {t.tagline}
          </p>
          <p className="mt-6 max-w-md text-muted">{t.pitch}</p>
          <div className="mt-10 flex w-full justify-center">
            <BetaRequest lang={lang} />
          </div>
          <p className="mt-6 text-sm text-muted">{t.alreadyInvited}</p>
        </section>

        <div className="mx-auto hidden aspect-[720/856] h-[min(78vh,800px)] overflow-hidden rounded-3xl shadow-2xl shadow-black/10 ring-1 ring-border lg:block">
          <video
            className="h-full w-full object-cover dark:hidden"
            src="/videos/rotation-claire.mp4"
            autoPlay
            muted
            loop
            playsInline
            aria-label={t.videoLabel}
          />
          <video
            className="hidden h-full w-full object-cover dark:block"
            src="/videos/rotation-sombre.mp4"
            autoPlay
            muted
            loop
            playsInline
            aria-label={t.videoLabel}
          />
        </div>
      </main>

      <SiteFooter lang={lang} />
    </div>
  );
}
