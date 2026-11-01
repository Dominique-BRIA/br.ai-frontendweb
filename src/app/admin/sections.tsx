"use client";

import { type FormEvent, useState } from "react";
import { api, date, dateTime, number, useAdminData } from "./api";
import {
  Badge,
  Button,
  Card,
  Cell,
  ErrorText,
  inputClass,
  Stat,
  Table,
} from "./ui";

interface Overview {
  users: number;
  teams: number;
  projects: number;
  machinesOnline: number;
  ordersPending: number;
  ordersRunning: number;
  aiCalls24h: number;
  aiErrors24h: number;
  providerErrors24h: { provider: string; errors: number }[];
  newFeedback: number;
  chains: { serveur: string[]; cuisinier: string[] };
}

/** Santé de la plateforme : comptes, machines, commandes, appels d'IA et refus des fournisseurs. */
export function OverviewSection({ onSignedOut }: { onSignedOut: () => void }) {
  const { data, error } = useAdminData<Overview>("overview", onSignedOut);
  const pending = useAdminData<{
    orders: {
      id: string;
      number: number;
      title: string;
      project: string;
      team: string;
      createdAt: string;
    }[];
  }>("pending-orders", onSignedOut);
  if (error) return <ErrorText>{error}</ErrorText>;
  if (!data) return <p className="text-muted">Chargement…</p>;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Utilisateurs" value={number(data.users)} />
        <Stat label="Équipes" value={number(data.teams)} />
        <Stat label="Projets" value={number(data.projects)} />
        <Stat label="Machines connectées" value={number(data.machinesOnline)} />
        <Stat label="Commandes en cours" value={number(data.ordersRunning)} />
        <Stat
          label="Commandes sans machine"
          value={number(data.ordersPending)}
          tone={data.ordersPending > 0 ? "warm" : undefined}
        />
        <Stat label="Appels d'IA (24 h)" value={number(data.aiCalls24h)} />
        <Stat
          label="Échecs d'IA (24 h)"
          value={number(data.aiErrors24h)}
          tone={data.aiErrors24h > 0 ? "danger" : undefined}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Fournisseurs d'IA et ordre de secours">
          <p className="mb-1 text-sm">
            <span className="text-muted">Serveur : </span>
            <span className="font-mono">
              {data.chains.serveur.join(" → ") || "désactivé"}
            </span>
          </p>
          <p className="mb-3 text-sm">
            <span className="text-muted">Cuisinier : </span>
            <span className="font-mono">
              {data.chains.cuisinier.join(" → ") || "désactivé"}
            </span>
          </p>
          <p className="text-sm text-muted">
            Refus des offres gratuites sur 24 h (limites de débit, quotas) :{" "}
            {data.providerErrors24h.length === 0
              ? "aucun."
              : data.providerErrors24h
                  .map((row) => `${row.provider} ${row.errors}`)
                  .join(", ")}
          </p>
          <p className="mt-2 text-xs text-muted">
            L'ordre se règle dans les variables AI_SERVEUR_CHAIN et
            AI_CUISINIER_CHAIN du serveur.
          </p>
        </Card>
        <Card title="Commandes en attente d'une machine">
          {pending.data?.orders.length ? (
            <ul className="flex flex-col gap-1 text-sm">
              {pending.data.orders.map((order) => (
                <li key={order.id}>
                  <span className="font-medium">
                    {order.team} · {order.project}
                  </span>{" "}
                  — n° {order.number} {order.title}{" "}
                  <span className="text-muted">
                    ({dateTime(order.createdAt)})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Aucune.</p>
          )}
        </Card>
      </div>
      {data.newFeedback > 0 && (
        <p className="text-sm">
          <Badge tone="accent">{data.newFeedback}</Badge> retour(s) de testeurs
          à lire.
        </p>
      )}
    </div>
  );
}

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  suspendedAt: string | null;
  teams: number;
  lastSeenAt: string | null;
  online: boolean;
}

/** Utilisateurs : recherche, dernière activité, suspension. */
export function UsersSection({ onSignedOut }: { onSignedOut: () => void }) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const { data, error, reload } = useAdminData<{ users: AdminUser[] }>(
    `users?search=${encodeURIComponent(query)}`,
    onSignedOut,
  );

  const toggle = async (user: AdminUser) => {
    const suspend = !user.suspendedAt;
    if (
      suspend &&
      !window.confirm(
        `Suspendre ${user.displayName} ? Ses machines seront déconnectées.`,
      )
    )
      return;
    await api(`users/${user.id}`, {
      method: "PATCH",
      body: { suspended: suspend },
    });
    await reload();
  };

  return (
    <Card
      title="Utilisateurs"
      actions={
        <form
          className="flex gap-2"
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            setQuery(search);
          }}
        >
          <input
            className={inputClass}
            placeholder="Nom ou adresse"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button type="submit">Chercher</Button>
        </form>
      }
    >
      <ErrorText>{error}</ErrorText>
      <Table
        head={[
          "Nom",
          "Adresse",
          "Équipes",
          "Inscription",
          "Dernière activité",
          "État",
          "",
        ]}
      >
        {data?.users.map((user) => (
          <tr key={user.id}>
            <Cell>{user.displayName}</Cell>
            <Cell mono>{user.email}</Cell>
            <Cell>{user.teams}</Cell>
            <Cell>{date(user.createdAt)}</Cell>
            <Cell>
              {user.online ? (
                <Badge tone="accent">en ligne</Badge>
              ) : (
                dateTime(user.lastSeenAt)
              )}
            </Cell>
            <Cell>
              {user.suspendedAt ? (
                <Badge tone="danger">suspendu</Badge>
              ) : (
                <Badge>actif</Badge>
              )}
            </Cell>
            <Cell>
              <Button
                kind={user.suspendedAt ? "secondary" : "danger"}
                onClick={() => void toggle(user)}
              >
                {user.suspendedAt ? "Rétablir" : "Suspendre"}
              </Button>
            </Cell>
          </tr>
        ))}
      </Table>
    </Card>
  );
}

interface AdminTeam {
  id: string;
  name: string;
  planId: string;
  effectivePlan: string;
  planEndsAt: string | null;
  members: number;
  projects: number;
  used: number;
  quota: number;
  createdAt: string;
}

interface Plan {
  id: string;
  name: string;
  maxMembers: number;
  maxProjects: number;
  monthlyCredits: number;
}

/** Équipes : formule, consommation du mois ; changer la formule ou accorder des crédits. */
export function TeamsSection({ onSignedOut }: { onSignedOut: () => void }) {
  const { data, error, reload } = useAdminData<{ teams: AdminTeam[] }>(
    "teams",
    onSignedOut,
  );
  const plans = useAdminData<{ plans: Plan[] }>("plans", onSignedOut);
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <Card title="Équipes">
      <ErrorText>{error}</ErrorText>
      <Table
        head={[
          "Équipe",
          "Formule",
          "Fin",
          "Membres",
          "Projets",
          "Crédits du mois",
          "",
        ]}
      >
        {data?.teams.map((team) => {
          const ratio = team.quota > 0 ? team.used / team.quota : 1;
          return (
            <tr key={team.id}>
              <Cell>{team.name}</Cell>
              <Cell>{team.effectivePlan}</Cell>
              <Cell>{date(team.planEndsAt)}</Cell>
              <Cell>{team.members}</Cell>
              <Cell>{team.projects}</Cell>
              <Cell>
                <span
                  className={
                    ratio >= 1 ? "text-danger" : ratio >= 0.8 ? "text-warm" : ""
                  }
                >
                  {number(team.used)} / {number(team.quota)}
                </span>
              </Cell>
              <Cell>
                {editing === team.id ? (
                  <TeamEditor
                    team={team}
                    plans={plans.data?.plans ?? []}
                    onDone={async () => {
                      setEditing(null);
                      await reload();
                    }}
                  />
                ) : (
                  <Button onClick={() => setEditing(team.id)}>Modifier</Button>
                )}
              </Cell>
            </tr>
          );
        })}
      </Table>
    </Card>
  );
}

function TeamEditor({
  team,
  plans,
  onDone,
}: {
  team: AdminTeam;
  plans: Plan[];
  onDone: () => void;
}) {
  const [planId, setPlanId] = useState(team.planId);
  const [endsAt, setEndsAt] = useState(team.planEndsAt?.slice(0, 10) ?? "");
  const [credits, setCredits] = useState("");
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    try {
      await api(`teams/${team.id}`, {
        method: "PATCH",
        body: {
          planId,
          planEndsAt: endsAt
            ? new Date(`${endsAt}T23:59:59Z`).toISOString()
            : null,
          ...(Number(credits) > 0 && { grantCredits: Number(credits) }),
        },
      });
      onDone();
    } catch (cause) {
      setError((cause as Error).message);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <select
        className={inputClass}
        value={planId}
        onChange={(event) => setPlanId(event.target.value)}
      >
        {plans.map((plan) => (
          <option key={plan.id} value={plan.id}>
            {plan.name}
          </option>
        ))}
      </select>
      <input
        type="date"
        className={inputClass}
        value={endsAt}
        onChange={(event) => setEndsAt(event.target.value)}
        aria-label="Fin de la formule"
      />
      <input
        className={inputClass}
        inputMode="numeric"
        placeholder="Crédits offerts ce mois"
        value={credits}
        onChange={(event) => setCredits(event.target.value.replace(/\D/g, ""))}
      />
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <Button kind="primary" onClick={() => void save()}>
          Enregistrer
        </Button>
        <Button onClick={onDone}>Annuler</Button>
      </div>
    </div>
  );
}

interface Costs {
  byModel: {
    provider: string;
    model: string;
    calls: number;
    inputTokens: number;
    outputTokens: number;
    credits: number;
  }[];
  byTeam: { teamId: string; name: string; calls: number; credits: number }[];
  byPurpose: { purpose: string; calls: number; credits: number }[];
}

const PURPOSES: Record<string, string> = {
  serveur: "Agent serveur",
  cuisinier: "Cuisinier",
  absence: "Résumés d'absence",
};

/** Coûts d'IA sur 30 jours : par fournisseur et modèle, par usage, et les équipes les plus coûteuses. */
export function CostsSection({ onSignedOut }: { onSignedOut: () => void }) {
  const { data, error } = useAdminData<Costs>("costs", onSignedOut);
  if (error) return <ErrorText>{error}</ErrorText>;
  if (!data) return <p className="text-muted">Chargement…</p>;
  const topCredits = data.byTeam[0]?.credits ?? 0;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        30 derniers jours. Pendant la bêta, les offres d'IA utilisées sont
        gratuites : le coût réel est de 0 $, et les crédits mesurent la
        consommation pour fixer les prix.
      </p>
      <Card title="Par fournisseur et modèle">
        <Table
          head={[
            "Fournisseur",
            "Modèle",
            "Appels",
            "Jetons en entrée",
            "Jetons en sortie",
            "Crédits",
          ]}
        >
          {data.byModel.map((row) => (
            <tr key={`${row.provider}:${row.model}`}>
              <Cell>{row.provider}</Cell>
              <Cell mono>{row.model}</Cell>
              <Cell>{number(row.calls)}</Cell>
              <Cell>{number(row.inputTokens)}</Cell>
              <Cell>{number(row.outputTokens)}</Cell>
              <Cell>{number(row.credits)}</Cell>
            </tr>
          ))}
        </Table>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Par usage">
          <Table head={["Usage", "Appels", "Crédits"]}>
            {data.byPurpose.map((row) => (
              <tr key={row.purpose}>
                <Cell>{PURPOSES[row.purpose] ?? row.purpose}</Cell>
                <Cell>{number(row.calls)}</Cell>
                <Cell>{number(row.credits)}</Cell>
              </tr>
            ))}
          </Table>
        </Card>
        <Card title="Équipes les plus coûteuses">
          <Table head={["Équipe", "Appels", "Crédits", ""]}>
            {data.byTeam.map((row) => (
              <tr key={row.teamId}>
                <Cell>{row.name}</Cell>
                <Cell>{number(row.calls)}</Cell>
                <Cell>{number(row.credits)}</Cell>
                <Cell>
                  {topCredits > 0 && row.credits >= topCredits * 0.5 && (
                    <Badge tone="warm">à surveiller</Badge>
                  )}
                </Cell>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </div>
  );
}
