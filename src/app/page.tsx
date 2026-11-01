import { BetaRequest } from "./BetaRequest";
import { Emblem } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Page d'accueil : la promesse et la demande d'invitation à gauche, l'emblème animé à droite.
 * Chaque mode a sa vidéo, sur le fond qui lui correspond.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col px-4 py-5 sm:px-8 lg:px-14">
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Emblem className="h-11 w-11" />
          <span className="font-mono text-2xl font-semibold">{"<br/>"}</span>
        </span>
        <ThemeToggle withLabel />
      </header>

      <main className="grid flex-1 grid-cols-1 items-center gap-10 py-10 lg:grid-cols-2 lg:gap-16">
        <section className="mx-auto flex w-full min-w-0 max-w-xl flex-col items-center text-center">
          <h1 className="font-serif text-[2.6rem] leading-tight tracking-tight sm:text-6xl">
            Retour à la ligne
          </h1>
          <p className="mt-4 font-serif text-xl text-muted sm:text-2xl">
            Redonner un sens au travail d'équipe
          </p>
          <p className="mt-6 max-w-md text-muted">
            Un chat d'équipe où l'IA note vos décisions, arbitre vos désaccords
            et écrit le code sur vos machines.
          </p>
          <div className="mt-10 flex w-full justify-center">
            <BetaRequest />
          </div>
          <p className="mt-6 text-sm text-muted">
            Déjà invité ? Ouvrez {"<br/>"} dans VS Code pour vous connecter.
          </p>
        </section>

        <div className="mx-auto hidden aspect-[720/856] h-[min(80vh,820px)] overflow-hidden rounded-3xl shadow-2xl shadow-black/10 ring-1 ring-border lg:block">
          <video
            className="h-full w-full object-cover dark:hidden"
            src="/videos/rotation-claire.mp4"
            autoPlay
            muted
            loop
            playsInline
            aria-label="L'emblème de Retour à la ligne en rotation"
          />
          <video
            className="hidden h-full w-full object-cover dark:block"
            src="/videos/rotation-sombre.mp4"
            autoPlay
            muted
            loop
            playsInline
            aria-label="L'emblème de Retour à la ligne en rotation"
          />
        </div>
      </main>
    </div>
  );
}
