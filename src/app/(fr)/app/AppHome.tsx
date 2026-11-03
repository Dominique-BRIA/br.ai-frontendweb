"use client";

import { Folder, LogOut, MessagesSquare, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Emblem } from "../../Logo";
import { ThemeToggle } from "../../ThemeToggle";

interface Workspace {
  user: { id: string; displayName: string; email: string };
  teams: {
    id: string;
    name: string;
    myRole: "chef" | "membre";
    members: unknown[];
    projects: { id: string; name: string }[];
  }[];
}

const MARKETPLACE =
  "https://marketplace.visualstudio.com/items?itemName=br-ia.br-ia";

/** Accueil de la plateforme : le compte connecté, ses équipes et leurs projets. */
export function AppHome() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/app/workspace").catch(() => null);
      // Session expirée ou révoquée : retour à l'accueil, où l'on se reconnecte.
      if (response?.status === 401) {
        window.location.assign("/api/auth/logout");
        return;
      }
      if (!response?.ok) {
        setError("Le serveur <br/> ne répond pas. Réessayez dans un instant.");
        return;
      }
      setWorkspace((await response.json()) as Workspace);
    })();
  }, []);

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    window.location.assign("/");
  };

  return (
    <div className="flex min-h-screen flex-col px-4 py-5 sm:px-8 lg:px-14">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Emblem className="h-10 w-10" />
          <span className="font-mono text-xl font-semibold">{"<br/>"}</span>
        </div>
        <div className="flex items-center gap-2">
          {workspace && (
            <span className="hidden text-sm text-muted sm:inline">
              {workspace.user.displayName}
            </span>
          )}
          <ThemeToggle lang="fr" />
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-card px-4 text-sm font-semibold ring-1 ring-border transition-colors hover:text-accent"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Se déconnecter</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 py-10">
        {error && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
        {!workspace && !error && <p className="text-muted">Chargement…</p>}
        {workspace && (
          <>
            <h1 className="font-serif text-4xl tracking-tight">
              Bonjour {workspace.user.displayName}
            </h1>

            <section className="mt-8 flex items-start gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
              <MessagesSquare
                className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                aria-hidden="true"
              />
              <p className="text-sm text-muted">
                Le chat d'équipe arrive bientôt sur le web. En attendant, vos
                équipes et vos projets se retrouvent dans{" "}
                <a
                  href={MARKETPLACE}
                  className="font-semibold text-accent hover:underline"
                >
                  l'extension &lt;br/&gt; pour VS Code
                </a>
                , avec le même compte.
              </p>
            </section>

            <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-muted">
              Vos équipes
            </h2>
            {workspace.teams.length === 0 && (
              <p className="mt-3 text-muted">
                Vous ne faites encore partie d'aucune équipe. Créez la vôtre, ou
                rejoignez celle d'un collègue avec sa clé d'équipe, depuis
                l'extension.
              </p>
            )}
            <ul className="mt-3 flex flex-col gap-3">
              {workspace.teams.map((team) => (
                <li
                  key={team.id}
                  className="rounded-2xl bg-card p-5 ring-1 ring-border"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 font-semibold">
                      <Users
                        className="h-4 w-4 text-accent"
                        aria-hidden="true"
                      />
                      {team.name}
                    </span>
                    <span className="text-xs text-muted">
                      {team.myRole === "chef" ? "Chef d'équipe" : "Membre"} ·{" "}
                      {team.members.length} membre
                      {team.members.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  {team.projects.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-1">
                      {team.projects.map((project) => (
                        <li
                          key={project.id}
                          className="flex items-center gap-2 text-sm text-muted"
                        >
                          <Folder className="h-4 w-4" aria-hidden="true" />
                          {project.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
