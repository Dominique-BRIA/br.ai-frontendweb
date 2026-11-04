"use client";

import { Folder, Users } from "lucide-react";
import Link from "next/link";
import { useApp } from "./AppShell";

const MARKETPLACE =
  "https://marketplace.visualstudio.com/items?itemName=br-ia.br-ia";

/** Accueil de la plateforme : le compte connecté, ses équipes et leurs projets à ouvrir. */
export function AppHome() {
  const { workspace } = useApp();
  if (!workspace) return <p className="p-6 text-muted">Chargement…</p>;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-4xl tracking-tight">
        Bonjour {workspace.user.displayName}
      </h1>
      <p className="mt-3 text-muted">
        Choisissez un projet pour ouvrir son chat.
      </p>

      {workspace.teams.length === 0 && (
        <p className="mt-8 text-muted">
          Vous ne faites encore partie d'aucune équipe. Créez la vôtre, ou
          rejoignez celle d'un collègue avec sa clé d'équipe, depuis{" "}
          <a
            href={MARKETPLACE}
            className="font-semibold text-accent hover:underline"
          >
            l'extension pour VS Code
          </a>{" "}
          pour l'instant.
        </p>
      )}
      <ul className="mt-8 flex flex-col gap-3">
        {workspace.teams.map((team) => (
          <li
            key={team.id}
            className="rounded-2xl bg-card p-5 ring-1 ring-border"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 font-semibold">
                <Users className="h-4 w-4 text-accent" aria-hidden="true" />
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
                  <li key={project.id}>
                    <Link
                      href={`/app/p/${project.id}`}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted transition-colors hover:bg-accent-soft hover:text-foreground"
                    >
                      <Folder className="h-4 w-4" aria-hidden="true" />
                      {project.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
