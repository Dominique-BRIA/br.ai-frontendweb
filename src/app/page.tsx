export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-24">
      <p className="font-mono text-sm text-muted">{"<br>.ia"}</p>
      <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
        Un chat d'équipe où l'IA note vos décisions, arbitre vos désaccords et
        écrit le code sur vos machines.
      </h1>
      <p className="text-lg text-muted">
        {"<br>.ia"} est en cours de construction. Une bêta privée ouvrira bientôt, sur
        invitation.
      </p>
    </main>
  );
}
