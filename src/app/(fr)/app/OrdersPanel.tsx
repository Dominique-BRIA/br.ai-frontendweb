"use client";

import {
  ChevronDown,
  ChevronUp,
  CircleStop,
  ExternalLink,
  GitBranch,
  GitMerge,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useApp } from "./AppShell";
import { Markdown } from "./Markdown";
import { authorName, type Order } from "./types";

const STATUS: Record<Order["status"], { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-warm/15 text-warm" },
  running: { label: "En cours", className: "bg-primary/20 text-accent" },
  done: { label: "Terminée", className: "bg-msg-ai text-msg-ai-text" },
  failed: { label: "Non aboutie", className: "bg-danger/15 text-danger" },
  stopped: { label: "Arrêtée", className: "bg-border text-muted" },
};

const time = (iso: string) =>
  new Intl.DateTimeFormat("fr", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

/**
 * Les commandes du projet : leur état en direct, leurs étapes, et les actions possibles depuis le
 * web. Le travail lui-même se fait toujours sur la machine d'un membre.
 */
export function OrdersPanel({
  projectId,
  myUserId,
  isChef,
}: {
  projectId: string;
  myUserId: string;
  isChef: boolean;
}) {
  const { api, subscribe } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setOrders(
        (await api<{ orders: Order[] }>(`projects/${projectId}/orders`)).orders,
      );
    } catch {
      // La liste reste telle quelle.
    }
  }, [api, projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(
    () =>
      subscribe((event) => {
        if (event.type !== "order.updated" || !("order" in event)) return;
        const updated = event.order;
        if (updated.projectId !== projectId) return;
        setOrders((current) =>
          current.some((order) => order.id === updated.id)
            ? current.map((order) =>
                order.id === updated.id ? updated : order,
              )
            : [updated, ...current],
        );
      }),
    [subscribe, projectId],
  );

  const mine = (order: Order) =>
    isChef ||
    (order.requestedBy.kind === "member" &&
      order.requestedBy.userId === myUserId);

  const act = async (order: Order, action: "stop" | "validate") => {
    setBusy(order.id);
    setNotice(null);
    try {
      if (action === "stop") {
        await api(`orders/${order.id}/stop`, { method: "POST" });
        setNotice({ ok: true, text: `Commande n° ${order.number} arrêtée.` });
      } else {
        const result = await api<
          | { viaServer: false }
          | {
              viaServer: true;
              merged: boolean;
              reason: string | null;
              url: string;
            }
        >(`orders/${order.id}/validate`, { method: "POST" });
        if (!result.viaServer) {
          setNotice({
            ok: false,
            text: "L'application GitHub n'est pas installée sur ce dépôt : validez cette commande depuis VS Code.",
          });
        } else if (result.merged) {
          setNotice({
            ok: true,
            text: `Commande n° ${order.number} validée et fusionnée.`,
          });
        } else {
          setNotice({
            ok: false,
            text: `La pull request est ouverte, mais GitHub refuse la fusion : ${result.reason ?? ""}`,
          });
        }
      }
      await load();
    } catch (cause) {
      setNotice({ ok: false, text: (cause as Error).message });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <p className="text-sm text-muted">
        Pour passer commande, demandez-le à{" "}
        <strong className="text-foreground">@bria</strong> dans le chat. Le
        cuisinier travaille sur la machine d'un membre qui a ouvert le projet
        dans VS Code.
      </p>
      {notice && (
        <p
          role={notice.ok ? "status" : "alert"}
          className={`mt-3 text-sm ${notice.ok ? "text-accent" : "text-danger"}`}
        >
          {notice.text}
        </p>
      )}
      {orders.length === 0 && (
        <p className="mt-4 text-sm text-muted">Pas encore de commande.</p>
      )}
      <ul className="mt-4 flex flex-col gap-3">
        {orders.map((order) => {
          const status = STATUS[order.status];
          const expanded = open === order.id;
          const canStop =
            (order.status === "pending" || order.status === "running") &&
            mine(order);
          const canValidate =
            order.status === "done" &&
            order.commit &&
            order.pushed &&
            !order.merged &&
            mine(order);
          return (
            <li
              key={order.id}
              className="rounded-xl bg-card p-3 text-sm ring-1 ring-border"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold">
                  n° {order.number} · {order.title}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${status.className}`}
                >
                  {status.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {authorName(order.requestedBy)} · {time(order.createdAt)}
                {order.machine && ` · machine de ${order.machine.displayName}`}
              </p>
              {order.branch && (
                <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted">
                  <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="font-mono">{order.branch}</span>
                  {order.commit &&
                    ` · ${order.commit} · ${order.merged ? "fusionné" : order.pushed ? "poussé" : "pas encore poussé"}`}
                  {order.pullRequest && (
                    <a
                      href={order.pullRequest.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-accent hover:underline"
                    >
                      · PR n° {order.pullRequest.number}
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  )}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                {canValidate && (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void act(order, "validate")}
                    className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
                  >
                    <GitMerge className="h-3.5 w-3.5" aria-hidden="true" />
                    Valider et fusionner
                  </button>
                )}
                {canStop && (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void act(order, "stop")}
                    className="inline-flex items-center gap-1 text-danger hover:underline"
                  >
                    <CircleStop className="h-3.5 w-3.5" aria-hidden="true" />
                    Arrêter
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : order.id)}
                  aria-expanded={expanded}
                  className="inline-flex items-center gap-1 text-muted hover:text-foreground"
                >
                  {expanded ? (
                    <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  Détails
                </button>
              </div>
              {expanded && (
                <div className="mt-3 border-t border-border pt-3">
                  <p className="text-muted">{order.brief}</p>
                  {order.summary && (
                    <div className="mt-2">
                      <Markdown text={order.summary} />
                    </div>
                  )}
                  {order.handoffNote && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Note de reprise
                      </p>
                      <Markdown text={order.handoffNote} />
                    </div>
                  )}
                  <ol className="mt-3 flex flex-col gap-1 text-xs text-muted">
                    {[...order.steps].reverse().map((step) => (
                      <li
                        key={`${step.at}-${step.text}`}
                        className={step.kind === "error" ? "text-danger" : ""}
                      >
                        {time(step.at)} · {step.text}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
