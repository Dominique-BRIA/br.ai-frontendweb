"use client";

import {
  Copy,
  Folder,
  Gauge,
  KeyRound,
  LogOut,
  Plus,
  RefreshCw,
  Tag,
  UserMinus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { fieldClass, primaryButtonClass } from "./AppHome";
import { useApp } from "./AppShell";
import { BackLink } from "./BackLink";
import type { TeamUsage } from "./types";

interface Invitation {
  code: string;
  expiresAt: string;
}

const date = (iso: string) =>
  new Intl.DateTimeFormat("fr", { day: "numeric", month: "long" }).format(
    new Date(iso),
  );
const number = new Intl.NumberFormat("fr");

const sectionClass = "rounded-2xl bg-card p-5 ring-1 ring-border";
const titleClass = "flex items-center gap-2 font-semibold";

/** Une équipe : ses projets, ses membres, sa clé d'invitation et ses crédits d'IA. */
export function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const router = useRouter();
  const { workspace, api, reload } = useApp();
  const team = workspace?.teams.find((candidate) => candidate.id === teamId);
  const isChef = team?.myRole === "chef";

  const [usage, setUsage] = useState<TeamUsage | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null | undefined>(
    undefined,
  );
  const [projectName, setProjectName] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadUsage = useCallback(async () => {
    try {
      setUsage(await api<TeamUsage>(`teams/${teamId}/usage`));
    } catch {
      setUsage(null);
    }
  }, [api, teamId]);

  useEffect(() => {
    void loadUsage();
  }, [loadUsage]);

  useEffect(() => {
    if (!isChef) return;
    void api<{ invitation: Invitation | null }>(
      `teams/${teamId}/invitations/current`,
    )
      .then((answer) => setInvitation(answer.invitation))
      .catch(() => setInvitation(null));
  }, [api, teamId, isChef]);

  if (!workspace) return <p className="p-6 text-muted">Chargement…</p>;
  if (!team)
    return (
      <p className="p-6 text-muted">
        Cette équipe n'existe pas, ou vous n'en faites plus partie.
      </p>
    );

  /** Lance une action ; son message (réussite ou erreur) s'affiche en haut de la page. */
  const run = async (action: () => Promise<string | null>) => {
    setBusy(true);
    setNotice(null);
    try {
      const text = await action();
      if (text) setNotice({ ok: true, text });
    } catch (cause) {
      setNotice({ ok: false, text: (cause as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const createProject = (event: FormEvent) => {
    event.preventDefault();
    const name = projectName.trim();
    if (!name) return;
    void run(async () => {
      const { project } = await api<{ project: { id: string } }>(
        `teams/${teamId}/projects`,
        {
          method: "POST",
          body: { name },
        },
      );
      setProjectName("");
      await reload();
      router.push(`/app/p/${project.id}`);
      return null;
    });
  };

  const redeem = (event: FormEvent) => {
    event.preventDefault();
    const typed = code.trim().toUpperCase();
    if (!typed) return;
    void run(async () => {
      const { message } = await api<{ message: string }>(
        `teams/${teamId}/promo`,
        {
          method: "POST",
          body: { code: typed },
        },
      );
      setCode("");
      await loadUsage();
      return message;
    });
  };

  const newKey = () =>
    void run(async () => {
      setInvitation(
        await api<Invitation>(`teams/${teamId}/invitations`, {
          method: "POST",
        }),
      );
      return "Nouvelle clé créée. L'ancienne ne fonctionne plus.";
    });

  const copyKey = async () => {
    if (!invitation) return;
    try {
      await navigator.clipboard.writeText(invitation.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setNotice({
        ok: false,
        text: "La copie n'a pas fonctionné : sélectionnez la clé à la main.",
      });
    }
  };

  const removeMember = (userId: string, name: string) => {
    if (!window.confirm(`Retirer ${name} de l'équipe ?`)) return;
    void run(async () => {
      await api(`teams/${teamId}/members/${userId}`, { method: "DELETE" });
      await reload();
      return `${name} ne fait plus partie de l'équipe.`;
    });
  };

  const leave = () => {
    if (!window.confirm(`Quitter l'équipe ${team.name} ?`)) return;
    void run(async () => {
      await api(`teams/${teamId}/leave`, { method: "POST" });
      await reload();
      router.push("/app");
      return null;
    });
  };

  const ratio =
    usage && usage.quota > 0 ? Math.min(usage.used / usage.quota, 1) : 1;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <div className="flex items-center gap-3">
        <BackLink />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">{team.name}</h1>
          <p className="text-sm text-muted">
            {isChef
              ? "Vous êtes le chef de cette équipe"
              : "Vous êtes membre de cette équipe"}
          </p>
        </div>
      </div>

      {notice && (
        <p
          role={notice.ok ? "status" : "alert"}
          className={`mt-4 text-sm ${notice.ok ? "text-accent" : "text-danger"}`}
        >
          {notice.text}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4">
        <section className={sectionClass}>
          <h2 className={titleClass}>
            <Folder className="h-4 w-4 text-accent" aria-hidden="true" />
            Projets
          </h2>
          {team.projects.length === 0 && (
            <p className="mt-2 text-sm text-muted">Pas encore de projet.</p>
          )}
          <ul className="mt-2 flex flex-col gap-1">
            {team.projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/app/p/${project.id}`}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-accent-soft hover:text-foreground"
                >
                  <Folder className="h-4 w-4" aria-hidden="true" />
                  {project.name}
                </Link>
              </li>
            ))}
          </ul>
          {isChef && (
            <form onSubmit={createProject} className="mt-4 flex gap-2">
              <input
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Nom du nouveau projet"
                aria-label="Nom du nouveau projet"
                maxLength={80}
                className={fieldClass}
              />
              <button
                type="submit"
                disabled={!projectName.trim() || busy}
                className={primaryButtonClass}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Créer
              </button>
            </form>
          )}
        </section>

        <section className={sectionClass}>
          <h2 className={titleClass}>
            <Gauge className="h-4 w-4 text-accent" aria-hidden="true" />
            Crédits d'IA
          </h2>
          {usage ? (
            <>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
                <div
                  className={`h-full rounded-full ${ratio >= 1 ? "bg-danger" : ratio >= 0.8 ? "bg-warm" : "bg-primary"}`}
                  style={{ width: `${ratio * 100}%` }}
                />
              </div>
              <p className="mt-2 text-sm">
                {number.format(Math.round(usage.used))} crédits utilisés sur{" "}
                {number.format(usage.quota)} ce mois-ci
                {usage.bonus > 0 &&
                  ` (dont ${number.format(usage.bonus)} offerts par un code)`}
                .
              </p>
              {usage.quota <= 0 && (
                <p className="mt-1 text-sm text-muted">
                  Sans crédit, l'IA ne répond pas.{" "}
                  {isChef
                    ? "Saisissez un code ci-dessous pour l'activer."
                    : "Le chef peut saisir un code pour l'activer."}
                </p>
              )}
              {isChef && usage.byMember.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1 text-sm text-muted">
                  {usage.byMember.map((member) => (
                    <li key={member.userId} className="flex justify-between">
                      <span>{member.displayName}</span>
                      <span>{number.format(Math.round(member.credits))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">Chargement…</p>
          )}
          {isChef && (
            <form onSubmit={redeem} className="mt-4 flex gap-2">
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="Code d'invitation ou promo"
                aria-label="Code d'invitation ou promo"
                className={`${fieldClass} font-mono`}
              />
              <button
                type="submit"
                disabled={!code.trim() || busy}
                className={primaryButtonClass}
              >
                <Tag className="h-4 w-4" aria-hidden="true" />
                Appliquer
              </button>
            </form>
          )}
        </section>

        {isChef && (
          <section className={sectionClass}>
            <h2 className={titleClass}>
              <KeyRound className="h-4 w-4 text-accent" aria-hidden="true" />
              Clé d'équipe
            </h2>
            <p className="mt-1 text-sm text-muted">
              Donnez-la à vos collègues pour qu'ils rejoignent l'équipe.
            </p>
            {invitation === undefined && (
              <p className="mt-3 text-sm text-muted">Chargement…</p>
            )}
            {invitation && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <code className="rounded-lg bg-field px-3 py-2 font-mono text-lg ring-1 ring-border">
                  {invitation.code}
                </code>
                <button
                  type="button"
                  onClick={() => void copyKey()}
                  className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  {copied ? "Copiée" : "Copier"}
                </button>
                <span className="text-xs text-muted">
                  Valable jusqu'au {date(invitation.expiresAt)}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={newKey}
              disabled={busy}
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {invitation ? "Créer une nouvelle clé" : "Créer une clé"}
            </button>
          </section>
        )}

        <section className={sectionClass}>
          <h2 className={titleClass}>
            <Users className="h-4 w-4 text-accent" aria-hidden="true" />
            Membres
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {team.members.map((member) => (
              <li
                key={member.userId}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${member.online ? "bg-msg-ai-text" : "bg-border"}`}
                    title={member.online ? "En ligne" : "Hors ligne"}
                  />
                  {member.displayName}
                  {member.userId === workspace.user.id && (
                    <span className="text-muted">(vous)</span>
                  )}
                  {member.role === "chef" && (
                    <span className="text-xs text-muted">· chef</span>
                  )}
                </span>
                {isChef && member.userId !== workspace.user.id && (
                  <button
                    type="button"
                    onClick={() =>
                      removeMember(member.userId, member.displayName)
                    }
                    disabled={busy}
                    title={`Retirer ${member.displayName}`}
                    className="text-muted hover:text-danger"
                  >
                    <UserMinus className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">
                      Retirer {member.displayName}
                    </span>
                  </button>
                )}
              </li>
            ))}
          </ul>
          {!isChef && (
            <button
              type="button"
              onClick={leave}
              disabled={busy}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-danger hover:underline"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Quitter l'équipe
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
