"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { dateTime, useAdminData } from "./api";
import { Button, Card, Cell, ErrorText, PageHeader, Row, Table } from "./ui";

interface Entry {
  id: string;
  actor: string;
  action: string;
  method: string;
  route: string;
  targetId: string | null;
  detail: string | null;
  statusCode: number;
  ip: string | null;
  createdAt: string;
}

const PAGE = 50;
const MAX = 500;
/** Le verbe que le serveur donne à une route qui modifie sans être décrite. */
const UNMAPPED = "Action non décrite";

/** Le journal : qui a fait quoi dans le tableau de bord, de la plus récente à la plus ancienne. */
export function JournalSection({ onSignedOut }: { onSignedOut: () => void }) {
  const [action, setAction] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const query = `limit=${limit}${action ? `&action=${encodeURIComponent(action)}` : ""}`;
  const { data, error, reload } = useAdminData<{ entries: Entry[] }>(
    `audit?${query}`,
    onSignedOut,
  );
  const actions = useAdminData<{
    actions: { action: string; value: number }[];
  }>("audit/actions", onSignedOut);
  const unmapped =
    actions.data?.actions.find((item) => item.action === UNMAPPED)?.value ?? 0;
  const rows = data?.entries ?? [];

  const choose = (value: string) => {
    setAction(value);
    setLimit(PAGE);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Journal"
        subtitle="Chaque modification faite depuis le tableau de bord, et les connexions"
        actions={
          <>
            <select
              value={action}
              onChange={(event) => choose(event.target.value)}
              aria-label="Filtrer par action"
              className="h-9 w-60 rounded-lg border border-border bg-field px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="">Toutes les actions</option>
              {actions.data?.actions.map((item) => (
                <option key={item.action} value={item.action}>
                  {item.action} ({item.value})
                </option>
              ))}
            </select>
            <Button
              safe
              icon={RefreshCw}
              title="Actualiser"
              onClick={() => {
                void reload();
                void actions.reload();
              }}
            />
          </>
        }
      />

      {/* Une route qui modifie sans verbe décrit : un oubli à corriger côté serveur. */}
      {unmapped > 0 && (
        <button
          type="button"
          onClick={() => choose(UNMAPPED)}
          className="flex w-full items-center gap-2 rounded-lg bg-warm/15 px-4 py-2.5 text-left text-sm transition-colors hover:bg-warm/25"
        >
          <AlertTriangle
            className="h-4 w-4 shrink-0 text-warm"
            aria-hidden="true"
          />
          <span>
            <strong>{unmapped}</strong> action{unmapped > 1 ? "s" : ""} sur une
            route que le journal ne décrit pas encore.
          </span>
        </button>
      )}

      <Card
        title={`${rows.length} action${rows.length > 1 ? "s" : ""}${action ? ` · ${action}` : ""}`}
        description="De la plus récente à la plus ancienne. Les simples consultations et les actions refusées n'y figurent pas, sauf les connexions refusées."
      >
        <ErrorText>{error}</ErrorText>
        {data && rows.length === 0 && (
          <p className="text-sm text-muted">
            Aucune action enregistrée{action ? " pour ce filtre" : ""}.
          </p>
        )}
        {rows.length > 0 && (
          <Table
            head={["Quand", "Qui", "Action", "Cible", "Détail", "Origine"]}
          >
            {rows.map((entry) => (
              <Row key={entry.id}>
                <Cell>
                  <span className="whitespace-nowrap text-xs tabular-nums text-muted">
                    {dateTime(entry.createdAt)}
                  </span>
                </Cell>
                <Cell strong>{entry.actor}</Cell>
                <Cell>
                  <span
                    title={`${entry.method} ${entry.route}`}
                    className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                      entry.action === UNMAPPED
                        ? "bg-warm/15 text-warm"
                        : entry.action === "Connexion refusée"
                          ? "bg-danger/10 text-danger"
                          : "bg-accent-soft text-foreground"
                    }`}
                  >
                    {entry.action}
                  </span>
                </Cell>
                <Cell mono>
                  <span className="text-xs text-muted">
                    {entry.targetId ? entry.targetId.slice(0, 8) : "—"}
                  </span>
                </Cell>
                <Cell>
                  <span
                    className="block max-w-xs truncate text-sm text-muted"
                    title={entry.detail ?? undefined}
                  >
                    {entry.detail ?? "—"}
                  </span>
                </Cell>
                <Cell>
                  <span className="whitespace-nowrap text-xs tabular-nums text-muted">
                    {entry.ip ?? "—"} · {entry.statusCode}
                  </span>
                </Cell>
              </Row>
            ))}
          </Table>
        )}
        {/* Pas de coupure silencieuse : quand la liste s'arrête, on dit pourquoi. */}
        {rows.length >= limit && (
          <div className="mt-8 flex items-center gap-3 border-t border-border pt-4">
            {limit >= MAX ? (
              <span className="text-sm text-muted">
                Affichage limité aux {MAX} dernières actions : filtrez par
                action pour remonter plus loin.
              </span>
            ) : (
              <Button
                safe
                onClick={() => setLimit(Math.min(limit + PAGE, MAX))}
              >
                Charger {PAGE} de plus
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
