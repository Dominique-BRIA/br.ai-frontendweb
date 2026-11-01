"use client";

import {
  Bot,
  Coins,
  MessagesSquare,
  RefreshCw,
  UserPlus,
  Users,
  Workflow,
} from "lucide-react";
import { useState } from "react";
import { number, useAdminData } from "./api";
import {
  ChartCard,
  DailyArea,
  DailyColumns,
  Heatmap,
  Legend,
  SegmentedBar,
  type Series,
  shortDay,
} from "./charts";
import {
  Button,
  Card,
  Cell,
  ErrorText,
  PageHeader,
  Row,
  StatCard,
  Table,
} from "./ui";

interface Totals {
  newUsers: number;
  messages: number;
  activeMembers: number;
  orders: number;
  aiCalls: number;
  credits: number;
}

interface Statistics {
  days: number;
  timeZone: string;
  current: Totals;
  previous: Totals;
  timeline: {
    date: string;
    members: number;
    serveur: number;
    cuisinier: number;
    newUsers: number;
    orders: number;
    aiOk: number;
    aiFailed: number;
    credits: number;
  }[];
  orderStatuses: { status: string; value: number }[];
  heatmap: { weekday: number; hour: number; value: number }[];
  providers: { provider: string; ok: number; failed: number }[];
  topTeams: {
    id: string;
    name: string;
    messages: number;
    orders: number;
    credits: number;
  }[];
}

const PERIODS = [
  { days: 7, label: "7 derniers jours" },
  { days: 30, label: "30 derniers jours" },
  { days: 90, label: "90 derniers jours" },
];

const MESSAGE_SERIES: Series[] = [
  { key: "members", label: "Membres", color: "var(--series-1)" },
  { key: "serveur", label: "Serveur", color: "var(--series-2)" },
  { key: "cuisinier", label: "Cuisinier", color: "var(--series-3)" },
];

const AI_SERIES: Series[] = [
  { key: "aiOk", label: "Réussis", color: "var(--series-1)" },
  { key: "aiFailed", label: "Échoués", color: "var(--status-critical)" },
];

/** Évolution par rapport à la période précédente, en texte : la couleur n'y porte rien seule. */
function trend(current: number, previous: number, days: number): string {
  const versus = `par rapport aux ${days} jours précédents`;
  if (previous === 0)
    return current === 0 ? `Stable ${versus}` : `Nouveau ${versus}`;
  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) return `Stable ${versus}`;
  return `${change > 0 ? "+" : ""}${change} % ${versus}`;
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="pt-2 text-lg font-semibold tracking-tight">{children}</h2>
  );
}

/** Statistiques : l'activité de la plateforme sur une période, comparée à la précédente. */
export function StatisticsSection({
  onSignedOut,
}: {
  onSignedOut: () => void;
}) {
  const [days, setDays] = useState(30);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { data, error, reload } = useAdminData<Statistics>(
    `statistics?days=${days}&tz=${encodeURIComponent(tz)}`,
    onSignedOut,
  );
  // Pendant le rechargement d'une autre période, l'ancien rendu reste, atténué.
  const stale = data !== null && data.days !== days;

  const orderParts = data
    ? [
        {
          label: "Terminées",
          value: count(data.orderStatuses, ["done"]),
          color: "var(--status-good)",
          ink: "#ffffff",
        },
        {
          label: "En cours ou en attente",
          value: count(data.orderStatuses, ["pending", "running"]),
          color: "var(--status-warning)",
          ink: "#1c1c1c",
        },
        {
          label: "Arrêtées",
          value: count(data.orderStatuses, ["stopped"]),
          color: "var(--status-serious)",
          ink: "#1c1c1c",
        },
        {
          label: "Échouées",
          value: count(data.orderStatuses, ["failed"]),
          color: "var(--status-critical)",
          ink: "#ffffff",
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Statistiques"
        subtitle={`L'activité de la plateforme, comparée à la période précédente · fuseau ${tz}`}
        actions={
          <>
            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              aria-label="Période"
              className="h-9 rounded-lg border border-border bg-field px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              {PERIODS.map((period) => (
                <option key={period.days} value={period.days}>
                  {period.label}
                </option>
              ))}
            </select>
            <Button
              safe
              icon={RefreshCw}
              title="Actualiser"
              onClick={() => void reload()}
            />
          </>
        }
      />
      <ErrorText>{error}</ErrorText>

      {data && (
        <div
          className={`flex flex-col gap-6 transition-opacity ${stale ? "opacity-50" : ""}`}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Nouveaux comptes"
              value={number(data.current.newUsers)}
              icon={UserPlus}
              tone="success"
              hint={trend(
                data.current.newUsers,
                data.previous.newUsers,
                data.days,
              )}
            />
            <StatCard
              label="Membres actifs"
              value={number(data.current.activeMembers)}
              icon={Users}
              hint={trend(
                data.current.activeMembers,
                data.previous.activeMembers,
                data.days,
              )}
            />
            <StatCard
              label="Messages"
              value={number(data.current.messages)}
              icon={MessagesSquare}
              tone="violet"
              hint={trend(
                data.current.messages,
                data.previous.messages,
                data.days,
              )}
            />
            <StatCard
              label="Commandes du cuisinier"
              value={number(data.current.orders)}
              icon={Workflow}
              tone="warm"
              hint={trend(data.current.orders, data.previous.orders, data.days)}
            />
            <StatCard
              label="Appels d'IA"
              value={number(data.current.aiCalls)}
              icon={Bot}
              tone="slate"
              hint={trend(
                data.current.aiCalls,
                data.previous.aiCalls,
                data.days,
              )}
            />
            <StatCard
              label="Crédits consommés"
              value={number(data.current.credits)}
              icon={Coins}
              tone="warm"
              hint={trend(
                data.current.credits,
                data.previous.credits,
                data.days,
              )}
            />
          </div>

          <SectionTitle>Activité</SectionTitle>
          <div className="grid gap-6 xl:grid-cols-3">
            <ChartCard
              className="xl:col-span-2"
              title="Messages par jour"
              description="Membres, serveur et cuisinier"
              legend={<Legend items={MESSAGE_SERIES} />}
              table={{
                head: ["Jour", "Membres", "Serveur", "Cuisinier"],
                rows: data.timeline.map((point) => [
                  shortDay(point.date),
                  point.members,
                  point.serveur,
                  point.cuisinier,
                ]),
              }}
            >
              <DailyColumns data={data.timeline} series={MESSAGE_SERIES} />
            </ChartCard>
            <ChartCard
              title="Issue des commandes"
              description="Commandes passées au cuisinier sur la période"
              table={{
                head: ["Issue", "Commandes"],
                rows: orderParts.map((part) => [part.label, part.value]),
              }}
            >
              <SegmentedBar parts={orderParts} />
            </ChartCard>
          </div>
          <ChartCard
            title="Heures de pointe"
            description="Messages des membres, par jour de la semaine et par heure"
            table={{
              head: ["Jour", "Heure", "Messages"],
              rows: data.heatmap
                .slice()
                .sort((a, b) => b.value - a.value)
                .map((cell) => [
                  ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."][
                    cell.weekday - 1
                  ] ?? "",
                  `${cell.hour}h`,
                  cell.value,
                ]),
            }}
          >
            <Heatmap cells={data.heatmap} />
          </ChartCard>

          <SectionTitle>Croissance</SectionTitle>
          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard
              title="Nouveaux comptes par jour"
              table={{
                head: ["Jour", "Comptes"],
                rows: data.timeline.map((point) => [
                  shortDay(point.date),
                  point.newUsers,
                ]),
              }}
            >
              <DailyColumns
                data={data.timeline}
                series={[
                  {
                    key: "newUsers",
                    label: "Nouveaux comptes",
                    color: "var(--series-1)",
                  },
                ]}
              />
            </ChartCard>
            <ChartCard
              title="Commandes du cuisinier par jour"
              table={{
                head: ["Jour", "Commandes"],
                rows: data.timeline.map((point) => [
                  shortDay(point.date),
                  point.orders,
                ]),
              }}
            >
              <DailyColumns
                data={data.timeline}
                series={[
                  {
                    key: "orders",
                    label: "Commandes",
                    color: "var(--series-1)",
                  },
                ]}
              />
            </ChartCard>
          </div>

          <SectionTitle>Intelligence artificielle</SectionTitle>
          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard
              title="Appels d'IA par jour"
              description="Les échecs sont surtout des refus des offres gratuites"
              legend={<Legend items={AI_SERIES} />}
              table={{
                head: ["Jour", "Réussis", "Échoués"],
                rows: data.timeline.map((point) => [
                  shortDay(point.date),
                  point.aiOk,
                  point.aiFailed,
                ]),
              }}
            >
              <DailyColumns data={data.timeline} series={AI_SERIES} />
            </ChartCard>
            <ChartCard
              title="Crédits consommés par jour"
              table={{
                head: ["Jour", "Crédits"],
                rows: data.timeline.map((point) => [
                  shortDay(point.date),
                  point.credits,
                ]),
              }}
            >
              <DailyArea
                data={data.timeline}
                dataKey="credits"
                label="Crédits"
              />
            </ChartCard>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <Card title="Par fournisseur">
              {data.providers.length === 0 ? (
                <p className="text-sm text-muted">
                  Aucun appel sur la période.
                </p>
              ) : (
                <Table head={["Fournisseur", "Réussis", "Échoués", "Échec"]}>
                  {data.providers.map((provider) => {
                    const total = provider.ok + provider.failed;
                    return (
                      <Row key={provider.provider}>
                        <Cell strong>{provider.provider}</Cell>
                        <Cell>{number(provider.ok)}</Cell>
                        <Cell>{number(provider.failed)}</Cell>
                        <Cell>
                          {total
                            ? Math.round((provider.failed / total) * 100)
                            : 0}{" "}
                          %
                        </Cell>
                      </Row>
                    );
                  })}
                </Table>
              )}
            </Card>
            <Card title="Équipes les plus actives">
              {data.topTeams.length === 0 ? (
                <p className="text-sm text-muted">
                  Aucune activité sur la période.
                </p>
              ) : (
                <Table head={["Équipe", "Messages", "Commandes", "Crédits"]}>
                  {data.topTeams.map((team) => (
                    <Row key={team.id}>
                      <Cell strong>{team.name}</Cell>
                      <Cell>{number(team.messages)}</Cell>
                      <Cell>{number(team.orders)}</Cell>
                      <Cell>{number(team.credits)}</Cell>
                    </Row>
                  ))}
                </Table>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function count(
  statuses: { status: string; value: number }[],
  wanted: string[],
): number {
  return statuses
    .filter((row) => wanted.includes(row.status))
    .reduce((sum, row) => sum + row.value, 0);
}
