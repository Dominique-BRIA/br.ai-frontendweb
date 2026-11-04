"use client";

import { ChevronRight, Folder, KeyRound, Plus, Users } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useApp } from "./AppShell";

export const fieldClass =
  "h-11 min-w-0 flex-1 rounded-xl border border-border bg-field px-4 text-base outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20";
export const primaryButtonClass =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 font-semibold text-white transition hover:brightness-110 disabled:opacity-40";

/** Accueil de la plateforme : ses équipes et leurs projets, créer une équipe ou en rejoindre une. */
export function AppHome() {
  const { workspace, api, reload } = useApp();
  const [teamName, setTeamName] = useState("");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!workspace) return <p className="p-6 text-muted">Chargement…</p>;

  const run = async (
    kind: "create" | "join",
    action: () => Promise<unknown>,
  ) => {
    setBusy(kind);
    setError(null);
    try {
      await action();
      await reload();
      if (kind === "create") setTeamName("");
      else setKey("");
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const create = (event: FormEvent) => {
    event.preventDefault();
    const name = teamName.trim();
    if (name)
      void run("create", () =>
        api("teams", { method: "POST", body: { name } }),
      );
  };
  const join = (event: FormEvent) => {
    event.preventDefault();
    const code = key.trim().toUpperCase();
    if (code)
      void run("join", () =>
        api("invitations/accept", { method: "POST", body: { code } }),
      );
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-4xl tracking-tight">
        Bonjour {workspace.user.displayName}
      </h1>
      <p className="mt-3 text-muted">
        {workspace.teams.length > 0
          ? "Choisissez un projet pour ouvrir son chat."
          : "Créez votre équipe, ou rejoignez celle d'un collègue avec sa clé d'équipe."}
      </p>

      <ul className="mt-8 flex flex-col gap-3">
        {workspace.teams.map((team) => (
          <li
            key={team.id}
            className="rounded-2xl bg-card p-5 ring-1 ring-border"
          >
            <Link
              href={`/app/t/${team.id}`}
              className="flex items-center justify-between gap-3 rounded-lg hover:text-accent"
            >
              <span className="flex items-center gap-2 font-semibold">
                <Users className="h-4 w-4 text-accent" aria-hidden="true" />
                {team.name}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted">
                {team.myRole === "chef" ? "Chef d'équipe" : "Membre"} ·{" "}
                {team.members.length} membre
                {team.members.length > 1 ? "s" : ""}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
            {team.projects.length === 0 && (
              <p className="mt-3 text-sm text-muted">
                Pas encore de projet.{" "}
                {team.myRole === "chef" && (
                  <Link
                    href={`/app/t/${team.id}`}
                    className="text-accent hover:underline"
                  >
                    Créer le premier
                  </Link>
                )}
              </p>
            )}
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

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <form
          onSubmit={create}
          className="rounded-2xl bg-card p-5 ring-1 ring-border"
        >
          <h2 className="flex items-center gap-2 font-semibold">
            <Plus className="h-4 w-4 text-accent" aria-hidden="true" />
            Créer une équipe
          </h2>
          <p className="mt-1 text-sm text-muted">Vous en serez le chef.</p>
          <div className="mt-4 flex gap-2">
            <input
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="Nom de l'équipe"
              aria-label="Nom de l'équipe"
              maxLength={80}
              className={fieldClass}
            />
            <button
              type="submit"
              disabled={!teamName.trim() || busy !== null}
              className={primaryButtonClass}
            >
              Créer
            </button>
          </div>
        </form>
        <form
          onSubmit={join}
          className="rounded-2xl bg-card p-5 ring-1 ring-border"
        >
          <h2 className="flex items-center gap-2 font-semibold">
            <KeyRound className="h-4 w-4 text-accent" aria-hidden="true" />
            Rejoindre une équipe
          </h2>
          <p className="mt-1 text-sm text-muted">
            Avec la clé que le chef vous a donnée.
          </p>
          <div className="mt-4 flex gap-2">
            <input
              value={key}
              onChange={(event) => setKey(event.target.value.toUpperCase())}
              placeholder="Clé d'équipe"
              aria-label="Clé d'équipe"
              className={`${fieldClass} font-mono`}
            />
            <button
              type="submit"
              disabled={!key.trim() || busy !== null}
              className={primaryButtonClass}
            >
              Rejoindre
            </button>
          </div>
        </form>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
