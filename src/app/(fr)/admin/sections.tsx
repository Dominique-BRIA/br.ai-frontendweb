"use client";

import {
  AlertTriangle,
  Bot,
  Cpu,
  FolderKanban,
  Hourglass,
  Laptop,
  MessageSquareText,
  RefreshCw,
  Search,
  Users,
  UsersRound,
  Zap,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { api, date, dateTime, number, useAdminData } from "./api";
import {
  Badge,
  Button,
  Card,
  Cell,
  ErrorText,
  inputClass,
  Loading,
  Meter,
  PageHeader,
  Row,
  StatCard,
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

interface PendingOrder {
  id: string;
  number: number;
  title: string;
  project: string;
  team: string;
  createdAt: string;
}

/** Santé de la plateforme : comptes, machines, commandes, appels d'IA et refus des fournisseurs. */
export function OverviewSection({
  onSignedOut,
  onOpen,
}: {
  onSignedOut: () => void;
  onOpen: (section: "utilisateurs" | "equipes" | "couts" | "retours") => void;
}) {
  const { data, error, reload } = useAdminData<Overview>(
    "overview",
    onSignedOut,
  );
  const pending = useAdminData<{ orders: PendingOrder[] }>(
    "pending-orders",
    onSignedOut,
  );

  return (
    <>
      <PageHeader
        title="Vue d'ensemble"
        subtitle="La santé de la plateforme en un coup d'œil"
        actions={
          <Button
            safe
            icon={RefreshCw}
            title="Actualiser"
            onClick={() => void reload()}
          />
        }
      />
      <ErrorText>{error}</ErrorText>
      {!data ? (
        <Loading />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Utilisateurs"
              value={number(data.users)}
              icon={Users}
              onClick={() => onOpen("utilisateurs")}
            />
            <StatCard
              label="Équipes"
              value={number(data.teams)}
              icon={UsersRound}
              tone="violet"
              hint={`${number(data.projects)} projet(s)`}
              onClick={() => onOpen("equipes")}
            />
            <StatCard
              label="Machines connectées"
              value={number(data.machinesOnline)}
              icon={Laptop}
              tone="success"
              hint="en ce moment"
            />
            <StatCard
              label="Retours à lire"
              value={number(data.newFeedback)}
              icon={MessageSquareText}
              tone={data.newFeedback > 0 ? "warm" : "slate"}
              onClick={() => onOpen("retours")}
            />
            <StatCard
              label="Commandes en cours"
              value={number(data.ordersRunning)}
              icon={Zap}
              tone="accent"
            />
            <StatCard
              label="Commandes sans machine"
              value={number(data.ordersPending)}
              icon={Hourglass}
              tone={data.ordersPending > 0 ? "warm" : "slate"}
            />
            <StatCard
              label="Appels d'IA"
              value={number(data.aiCalls24h)}
              icon={Cpu}
              tone="violet"
              hint="sur 24 heures"
              onClick={() => onOpen("couts")}
            />
            <StatCard
              label="Échecs d'IA"
              value={number(data.aiErrors24h)}
              icon={AlertTriangle}
              tone={data.aiErrors24h > 0 ? "danger" : "slate"}
              hint="sur 24 heures"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card
              title="Fournisseurs d'IA"
              description="Ordre de secours, du premier essayé au dernier"
            >
              <div className="space-y-4">
                {(["serveur", "cuisinier"] as const).map((agent) => (
                  <div key={agent}>
                    <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Bot className="h-4 w-4 text-muted" aria-hidden="true" />
                      {agent === "serveur" ? "Agent serveur" : "Cuisinier"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {data.chains[agent].length === 0 && (
                        <Badge>désactivé</Badge>
                      )}
                      {data.chains[agent].map((model, index) => (
                        <span key={model} className="flex items-center gap-2">
                          {index > 0 && <span className="text-muted">→</span>}
                          <Badge tone={index === 0 ? "accent" : "slate"}>
                            {model}
                          </Badge>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-sm text-muted">
                  Refus des offres gratuites sur 24 h :{" "}
                  {data.providerErrors24h.length === 0
                    ? "aucun"
                    : data.providerErrors24h
                        .map((row) => `${row.provider} (${row.errors})`)
                        .join(", ")}
                  . L'ordre se règle dans AI_SERVEUR_CHAIN et
                  AI_CUISINIER_CHAIN.
                </p>
              </div>
            </Card>

            <Card
              title="Commandes en attente d'une machine"
              description="Aucune machine de l'équipe n'est disponible"
            >
              {pending.data?.orders.length ? (
                <ul className="divide-y divide-border">
                  {pending.data.orders.map((order) => (
                    <li
                      key={order.id}
                      className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <FolderKanban
                        className="mt-0.5 h-4 w-4 shrink-0 text-warm"
                        aria-hidden="true"
                      />
                      <div className="min-w-0 text-sm">
                        <p className="font-medium">
                          n° {order.number} · {order.title}
                        </p>
                        <p className="text-muted">
                          {order.team} · {order.project} · depuis le{" "}
                          {dateTime(order.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">Aucune commande n'attend.</p>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
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

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

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
    <>
      <PageHeader
        title="Utilisateurs"
        subtitle={data ? `${data.users.length} compte(s)` : undefined}
      />
      <Card
        actions={
          <form
            className="relative"
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              setQuery(search);
            }}
          >
            <Search
              className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted"
              aria-hidden="true"
            />
            <input
              className={`${inputClass} w-72 pl-9`}
              placeholder="Rechercher un nom ou une adresse"
              aria-label="Rechercher un utilisateur"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </form>
        }
        title="Comptes"
      >
        <ErrorText>{error}</ErrorText>
        <Table
          head={[
            "Utilisateur",
            "Équipes",
            "Inscription",
            "Dernière activité",
            "État",
            "",
          ]}
        >
          {data?.users.map((user) => (
            <Row key={user.id}>
              <Cell>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1860a0] to-[#0e385e] text-xs font-bold text-white">
                    {initials(user.displayName)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{user.displayName}</p>
                    <p className="truncate font-mono text-xs text-muted">
                      {user.email}
                    </p>
                  </div>
                </div>
              </Cell>
              <Cell>{user.teams}</Cell>
              <Cell>{date(user.createdAt)}</Cell>
              <Cell>
                {user.online ? (
                  <Badge tone="success">en ligne</Badge>
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
                  kind={user.suspendedAt ? "outline" : "danger"}
                  onClick={() => void toggle(user)}
                >
                  {user.suspendedAt ? "Rétablir" : "Suspendre"}
                </Button>
              </Cell>
            </Row>
          ))}
        </Table>
      </Card>
    </>
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
    <>
      <PageHeader
        title="Équipes"
        subtitle="Formule, limites et consommation du mois"
      />
      <Card>
        <ErrorText>{error}</ErrorText>
        <Table
          head={[
            "Équipe",
            "Formule",
            "Membres",
            "Projets",
            "Crédits du mois",
            "",
          ]}
        >
          {data?.teams.map((team) => {
            const ratio = team.quota > 0 ? team.used / team.quota : 1;
            return (
              <Row key={team.id}>
                <Cell strong>{team.name}</Cell>
                <Cell>
                  <Badge tone={team.planId === "essai" ? "slate" : "accent"}>
                    {team.effectivePlan}
                  </Badge>
                  {team.planEndsAt && (
                    <span className="ml-2 text-xs text-muted">
                      jusqu'au {date(team.planEndsAt)}
                    </span>
                  )}
                </Cell>
                <Cell>{team.members}</Cell>
                <Cell>{team.projects}</Cell>
                <Cell>
                  <div className="w-44 space-y-1.5">
                    <p className="text-xs tabular-nums">
                      {number(team.used)} / {number(team.quota)}
                    </p>
                    <Meter
                      ratio={ratio}
                      tone={
                        ratio >= 1 ? "danger" : ratio >= 0.8 ? "warm" : "accent"
                      }
                    />
                  </div>
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
                    <Button onClick={() => setEditing(team.id)}>
                      Modifier
                    </Button>
                  )}
                </Cell>
              </Row>
            );
          })}
        </Table>
      </Card>
    </>
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
    <div className="flex w-56 flex-col gap-2">
      <select
        className={inputClass}
        value={planId}
        onChange={(event) => setPlanId(event.target.value)}
        aria-label="Formule"
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
        aria-label="Crédits offerts ce mois"
        value={credits}
        onChange={(event) => setCredits(event.target.value.replace(/\D/g, ""))}
      />
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <Button kind="primary" onClick={() => void save()}>
          Enregistrer
        </Button>
        <Button kind="ghost" onClick={onDone}>
          Annuler
        </Button>
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
  const total = data?.byModel.reduce((sum, row) => sum + row.credits, 0) ?? 0;
  const calls = data?.byModel.reduce((sum, row) => sum + row.calls, 0) ?? 0;
  const topCredits = data?.byTeam[0]?.credits ?? 0;

  return (
    <>
      <PageHeader
        title="Coûts d'IA"
        subtitle="30 derniers jours. Pendant la bêta, les offres utilisées sont gratuites : les crédits mesurent la consommation pour fixer les prix."
      />
      <ErrorText>{error}</ErrorText>
      {!data ? (
        <Loading />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Crédits consommés"
              value={number(total)}
              icon={Zap}
            />
            <StatCard
              label="Appels"
              value={number(calls)}
              icon={Cpu}
              tone="violet"
            />
            <StatCard
              label="Coût réel"
              value="0 $"
              icon={Bot}
              tone="success"
              hint="offres gratuites pendant la bêta"
            />
          </div>
          <Card title="Par fournisseur et modèle">
            <Table
              head={[
                "Modèle",
                "Appels",
                "Jetons (entrée / sortie)",
                "Crédits",
                "Part",
              ]}
            >
              {data.byModel.map((row) => (
                <Row key={`${row.provider}:${row.model}`}>
                  <Cell>
                    <p className="font-medium">{row.model}</p>
                    <p className="text-xs text-muted">{row.provider}</p>
                  </Cell>
                  <Cell>{number(row.calls)}</Cell>
                  <Cell>
                    {number(row.inputTokens)} / {number(row.outputTokens)}
                  </Cell>
                  <Cell strong>{number(row.credits)}</Cell>
                  <Cell>
                    <div className="w-32">
                      <Meter ratio={total > 0 ? row.credits / total : 0} />
                    </div>
                  </Cell>
                </Row>
              ))}
            </Table>
          </Card>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Par usage">
              <div className="space-y-4">
                {data.byPurpose.map((row) => (
                  <div key={row.purpose} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {PURPOSES[row.purpose] ?? row.purpose}
                      </span>
                      <span className="tabular-nums text-muted">
                        {number(row.credits)} crédits · {number(row.calls)}{" "}
                        appels
                      </span>
                    </div>
                    <Meter
                      ratio={total > 0 ? row.credits / total : 0}
                      tone="accent"
                    />
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Équipes les plus coûteuses">
              <div className="space-y-4">
                {data.byTeam.map((row) => (
                  <div key={row.teamId} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        {row.name}
                        {topCredits > 0 && row.credits >= topCredits * 0.5 && (
                          <Badge tone="warm">à surveiller</Badge>
                        )}
                      </span>
                      <span className="tabular-nums text-muted">
                        {number(row.credits)} crédits
                      </span>
                    </div>
                    <Meter
                      ratio={topCredits > 0 ? row.credits / topCredits : 0}
                      tone="warm"
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
