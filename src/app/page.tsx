import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export default function Home() {
  return (
    <>
      <div className="flex justify-end px-6 pt-4">
        <ThemeToggle />
      </div>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-6 pb-16">
        <Logo className="h-auto w-72" />
        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
          Un chat d'équipe où l'IA note vos décisions, arbitre vos désaccords et
          écrit le code sur vos machines.
        </h1>
        <p className="text-lg text-muted">
          {"<br/>"} est en cours de construction. Une bêta privée ouvrira
          bientôt, sur invitation.
        </p>
      </main>
    </>
  );
}
