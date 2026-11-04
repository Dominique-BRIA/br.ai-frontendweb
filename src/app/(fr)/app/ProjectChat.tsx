"use client";

import {
  Check,
  CircleAlert,
  Clock,
  CornerUpLeft,
  Lightbulb,
  ListChecks,
  LoaderCircle,
  PanelRight,
  Paperclip,
  RotateCw,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useApp } from "./AppShell";
import { BackLink } from "./BackLink";
import { Markdown } from "./Markdown";
import { OrdersPanel } from "./OrdersPanel";
import {
  type Author,
  authorName,
  isAgent,
  type MemoryItem,
  type Message,
} from "./types";

const PAGE = 50;

const MEMORY_TITLES: Record<MemoryItem["type"], string> = {
  decision: "Décisions",
  question: "Questions ouvertes",
  task: "Tâches",
  compromise: "Compromis",
};

const time = (iso: string) =>
  new Intl.DateTimeFormat("fr", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );
const day = (iso: string) =>
  new Intl.DateTimeFormat("fr", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));

/** Un message parti de la page, pas encore enregistré par le serveur. */
interface Outgoing {
  clientId: string;
  body: string;
  mentions: string[];
  replyTo: Message["replyTo"];
  createdAt: string;
  status: "sending" | "failed";
}

type Status = "sending" | "failed" | "sent";

function initials(author: Author): string {
  if (isAgent(author)) return "IA";
  const name = authorName(author);
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Le chat d'un projet : messages en temps réel, réponses, mentions, et la mémoire du projet. */
export function ProjectChat() {
  const { projectId } = useParams<{ projectId: string }>();
  const { workspace, live, api, subscribe } = useApp();
  const team = workspace?.teams.find((candidate) =>
    candidate.projects.some((project) => project.id === projectId),
  );
  const project = team?.projects.find(
    (candidate) => candidate.id === projectId,
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [memory, setMemory] = useState<MemoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [outgoing, setOutgoing] = useState<Outgoing[]>([]);
  const [panel, setPanel] = useState<"memory" | "orders">("memory");
  const [panelOpen, setPanelOpen] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const myUserId = workspace?.user.id ?? "";
  const atBottom = useRef(true);

  const add = useCallback((incoming: Message[]) => {
    setMessages((current) => {
      const known = new Set(current.map((message) => message.id));
      return [
        ...current,
        ...incoming.filter((message) => !known.has(message.id)),
      ];
    });
  }, []);

  const loadMemory = useCallback(async () => {
    try {
      setMemory(
        (await api<{ items: MemoryItem[] }>(`projects/${projectId}/memory`))
          .items,
      );
    } catch {
      // La mémoire reste affichée telle quelle.
    }
  }, [api, projectId]);

  useEffect(() => {
    setMessages([]);
    setOutgoing([]);
    setReplyTo(null);
    atBottom.current = true;
    void (async () => {
      try {
        const page = await api<{ messages: Message[]; hasMore: boolean }>(
          `projects/${projectId}/messages?limit=${PAGE}`,
        );
        setMessages(page.messages);
        setHasMore(page.hasMore);
        setError(null);
      } catch (cause) {
        setError((cause as Error).message);
      }
    })();
    void loadMemory();
  }, [api, projectId, loadMemory]);

  useEffect(
    () =>
      subscribe((event) => {
        if (
          event.type === "message.created" &&
          "message" in event &&
          event.message.projectId === projectId
        ) {
          add([event.message]);
          // Le temps réel peut livrer le message avant la réponse de l'envoi : on retire son double.
          const author = event.message.author;
          if (author.kind === "member" && author.userId === myUserId) {
            const body = event.message.body;
            setOutgoing((current) => {
              const index = current.findIndex(
                (item) => item.status === "sending" && item.body === body,
              );
              return index < 0
                ? current
                : current.filter((_, position) => position !== index);
            });
          }
        }
        if (
          event.type === "memory.changed" &&
          "projectId" in event &&
          event.projectId === projectId
        ) {
          void loadMemory();
        }
      }),
    [subscribe, projectId, add, loadMemory, myUserId],
  );

  // On suit le bas du fil, sauf si le membre est remonté lire les anciens messages.
  useEffect(() => {
    const element = list.current;
    if (element && atBottom.current && messages.length + outgoing.length > 0)
      element.scrollTop = element.scrollHeight;
  }, [messages, outgoing]);

  const loadOlder = async () => {
    const element = list.current;
    const first = messages[0];
    if (!element || !first) return;
    const height = element.scrollHeight;
    const page = await api<{ messages: Message[]; hasMore: boolean }>(
      `projects/${projectId}/messages?limit=${PAGE}&before=${first.id}`,
    );
    atBottom.current = false;
    setMessages((current) => [...page.messages, ...current]);
    setHasMore(page.hasMore);
    requestAnimationFrame(() => {
      element.scrollTop = element.scrollHeight - height;
    });
  };

  /** Envoie un message en attente ; en cas d'échec, il reste affiché « non envoyé ». */
  const submit = async (item: Outgoing) => {
    setOutgoing((current) =>
      current.map((entry) =>
        entry.clientId === item.clientId
          ? { ...entry, status: "sending" }
          : entry,
      ),
    );
    try {
      const { message } = await api<{ message: Message }>(
        `projects/${projectId}/messages`,
        {
          method: "POST",
          body: {
            body: item.body,
            mentions: item.mentions,
            ...(item.replyTo ? { replyToId: item.replyTo.id } : {}),
          },
        },
      );
      setOutgoing((current) =>
        current.filter((entry) => entry.clientId !== item.clientId),
      );
      add([message]);
    } catch {
      setOutgoing((current) =>
        current.map((entry) =>
          entry.clientId === item.clientId
            ? { ...entry, status: "failed" }
            : entry,
        ),
      );
    }
  };

  // Le message part tout de suite : la zone se vide pour le suivant, et le fil montre son état.
  const send = (event?: FormEvent) => {
    event?.preventDefault();
    const body = draft.trim();
    if (!body) return;
    const lower = body.toLowerCase();
    const mentions = (team?.members ?? [])
      .filter((member) => member.userId !== myUserId)
      .filter((member) =>
        lower.includes(`@${member.displayName.toLowerCase()}`),
      )
      .map((member) => member.userId);
    const item: Outgoing = {
      clientId: crypto.randomUUID(),
      body,
      mentions,
      replyTo: replyTo
        ? {
            id: replyTo.id,
            author: replyTo.author,
            excerpt: replyTo.body.slice(0, 140),
          }
        : null,
      createdAt: new Date().toISOString(),
      status: "sending",
    };
    atBottom.current = true;
    setOutgoing((current) => [...current, item]);
    setDraft("");
    setReplyTo(null);
    void submit(item);
  };
  const sending = outgoing.some((item) => item.status === "sending");

  // Suggestions de mention : « @ » suivi du début d'un nom.
  const typed = /(^|\s)@([\p{L}\p{N}_-]*)$/u.exec(draft)?.[2];
  const candidates =
    typed === undefined
      ? []
      : ["bria", ...(team?.members ?? []).map((member) => member.displayName)]
          .filter((name) => name.toLowerCase().startsWith(typed.toLowerCase()))
          .slice(0, 6);
  const mention = (name: string) => {
    setDraft((current) => current.replace(/@[\p{L}\p{N}_-]*$/u, `@${name} `));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      send();
    }
  };

  if (workspace && !project) {
    return (
      <p className="p-6 text-muted">
        Ce projet n'existe pas, ou vous n'en faites pas partie.
      </p>
    );
  }

  const open = memory.filter((item) => item.status === "open");

  return (
    <div className="relative flex h-full min-h-0">
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
          <BackLink />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-semibold">{project?.name ?? "…"}</h1>
            <p className="truncate text-xs text-muted">
              {team?.name}
              {!live && " · reconnexion…"}
            </p>
          </div>
          {/* Sur un écran étroit, la mémoire et les commandes s'ouvrent par-dessus le fil. */}
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-sm text-muted ring-1 ring-border hover:text-foreground xl:hidden"
          >
            <PanelRight className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Mémoire et commandes</span>
          </button>
        </div>

        <div
          ref={list}
          onScroll={(event) => {
            const element = event.currentTarget;
            atBottom.current =
              element.scrollHeight - element.scrollTop - element.clientHeight <
              80;
          }}
          className="relative min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6"
        >
          {hasMore && (
            <div className="mb-4 text-center">
              <button
                type="button"
                onClick={() => void loadOlder()}
                className="rounded-xl px-3 py-1.5 text-sm text-accent ring-1 ring-border hover:bg-accent-soft"
              >
                Messages précédents
              </button>
            </div>
          )}
          {messages.length === 0 && !error && (
            <p className="mt-10 text-center text-muted">
              Pas encore de message. Écrivez à l'équipe, ou demandez quelque
              chose à @bria.
            </p>
          )}
          {messages.map((message, index) => {
            const before = messages[index - 1];
            const newDay =
              !before || day(before.createdAt) !== day(message.createdAt);
            return (
              <div key={message.id}>
                {newDay && (
                  <p className="my-4 text-center text-xs font-semibold uppercase tracking-wide text-muted">
                    {day(message.createdAt)}
                  </p>
                )}
                <MessageItem
                  message={message}
                  myUserId={myUserId}
                  onReply={() => setReplyTo(message)}
                />
              </div>
            );
          })}
          {outgoing.map((item) => (
            <MessageItem
              key={item.clientId}
              message={{
                id: item.clientId,
                projectId,
                author: { kind: "member", userId: myUserId, displayName: "" },
                body: item.body,
                replyTo: item.replyTo,
                mentions: item.mentions,
                attachments: [],
                createdAt: item.createdAt,
              }}
              myUserId={myUserId}
              status={item.status}
              onRetry={() => void submit(item)}
              onDiscard={() =>
                setOutgoing((current) =>
                  current.filter((entry) => entry.clientId !== item.clientId),
                )
              }
            />
          ))}
        </div>

        <form
          onSubmit={send}
          className="shrink-0 border-t border-border px-4 py-3 sm:px-6"
        >
          {error && (
            <p role="alert" className="mb-2 text-sm text-danger">
              {error}
            </p>
          )}
          {replyTo && (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-xl bg-card px-3 py-2 text-sm ring-1 ring-border">
              <span className="truncate text-muted">
                Réponse à{" "}
                <strong className="text-foreground">
                  {authorName(replyTo.author)}
                </strong>{" "}
                : {replyTo.body.slice(0, 120)}
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                title="Annuler la réponse"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
          {candidates.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {candidates.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => mention(name)}
                  className="rounded-lg bg-card px-2 py-1 text-sm ring-1 ring-border hover:text-accent"
                >
                  @{name}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
              rows={Math.min(8, Math.max(1, draft.split("\n").length))}
              placeholder="Écrire à l'équipe… (@bria pour l'IA)"
              aria-label="Message"
              className="max-h-60 min-h-12 flex-1 resize-none rounded-xl border border-border bg-field px-4 py-3 text-base outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              title="Envoyer"
              aria-busy={sending}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition hover:brightness-110 disabled:opacity-40"
            >
              {sending ? (
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="sr-only">Envoyer</span>
            </button>
          </div>
        </form>
      </section>

      <aside
        className={`${panelOpen ? "fixed inset-0 z-30 block" : "hidden"} overflow-y-auto bg-background p-4 xl:static xl:z-auto xl:block xl:w-80 xl:shrink-0 xl:border-l xl:border-border`}
        aria-label="Mémoire et commandes du projet"
      >
        <div className="flex items-center gap-1">
          {(
            [
              ["memory", "Mémoire", Lightbulb],
              ["orders", "Commandes", ListChecks],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPanel(key)}
              aria-pressed={panel === key}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${
                panel === key
                  ? "bg-accent-soft text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPanelOpen(false)}
            title="Fermer"
            className="ml-auto text-muted hover:text-foreground xl:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Fermer</span>
          </button>
        </div>
        <div className="mt-4">
          {panel === "orders" ? (
            <OrdersPanel
              projectId={projectId}
              myUserId={myUserId}
              isChef={team?.myRole === "chef"}
            />
          ) : (
            <>
              {open.length === 0 && (
                <p className="mt-3 text-sm text-muted">
                  Les décisions, questions et tâches notées par le serveur
                  apparaîtront ici.
                </p>
              )}
              {(Object.keys(MEMORY_TITLES) as MemoryItem["type"][]).map(
                (type) => {
                  const items = open.filter((item) => item.type === type);
                  if (items.length === 0) return null;
                  return (
                    <div key={type} className="mt-5">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                        {MEMORY_TITLES[type]}
                      </h3>
                      <ul className="mt-2 flex flex-col gap-2">
                        {items.map((item) => (
                          <li
                            key={item.id}
                            className="rounded-xl bg-card p-3 text-sm ring-1 ring-border"
                          >
                            {item.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                },
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

/**
 * Un message, aux couleurs choisies : bleu ardoise pour les siens, anthracite translucide pour
 * ceux des collègues, émeraude très sombre pour les IA.
 */
function MessageItem({
  message,
  myUserId,
  status,
  onReply,
  onRetry,
  onDiscard,
}: {
  message: Message;
  myUserId: string;
  /** Pour un message en route : l'horloge, ou l'échec avec Réessayer. */
  status?: Exclude<Status, "sent">;
  onReply?: () => void;
  onRetry?: () => void;
  onDiscard?: () => void;
}) {
  const mine =
    message.author.kind === "member" && message.author.userId === myUserId;
  const agent = isAgent(message.author);
  const mentionsMe = message.mentions.includes(myUserId);
  const state: Status | null = mine ? (status ?? "sent") : null;
  const bubble = mine
    ? "bg-msg-sent text-msg-on-sent border-transparent"
    : agent
      ? `bg-msg-ai ${mentionsMe ? "border-2 border-msg-ai-text" : "border border-msg-ai-border"}`
      : `bg-msg-received border ${mentionsMe ? "border-warm" : "border-msg-received-border"}`;

  return (
    <article className={`group mb-3 flex gap-3 ${mine ? "justify-end" : ""}`}>
      {!mine && (
        <span
          className={`mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            agent
              ? "border border-msg-ai-border bg-msg-ai text-msg-ai-text"
              : "bg-card ring-1 ring-border"
          }`}
          aria-hidden="true"
        >
          {initials(message.author)}
        </span>
      )}
      <div
        className={`flex min-w-0 max-w-[85%] flex-col ${mine ? "items-end" : "items-start"}`}
      >
        <div className="mb-1 flex items-center gap-2 text-xs">
          {!mine && (
            <span
              className={`font-semibold ${agent ? "text-msg-ai-text" : ""}`}
            >
              {authorName(message.author)}
            </span>
          )}
          <time className="text-muted" dateTime={message.createdAt}>
            {time(message.createdAt)}
          </time>
          {onReply && (
            <button
              type="button"
              onClick={onReply}
              title="Répondre"
              className="text-muted opacity-0 transition-opacity hover:text-foreground focus:opacity-100 group-hover:opacity-100"
            >
              <CornerUpLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">Répondre</span>
            </button>
          )}
        </div>
        <div
          className={`min-w-0 max-w-full rounded-2xl px-4 py-2.5 ${bubble} ${
            state === "sending"
              ? "opacity-85"
              : state === "failed"
                ? "outline outline-1 outline-danger"
                : ""
          }`}
        >
          {message.replyTo && (
            <p className="mb-2 border-l-2 border-current/40 pl-2 text-sm opacity-80">
              <strong>{authorName(message.replyTo.author)}</strong> :{" "}
              {message.replyTo.excerpt}
            </p>
          )}
          {message.body && <Markdown text={message.body} />}
          {message.attachments.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {message.attachments.map((file) => (
                <li key={file.id}>
                  <a
                    href={`/api/app/attachments/${file.id}`}
                    className="inline-flex items-center gap-1.5 text-sm underline underline-offset-2"
                  >
                    <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                    {file.name}
                  </a>
                </li>
              ))}
            </ul>
          )}
          {state && <StatusMark status={state} />}
        </div>
        {state === "failed" && (
          <div className="mt-1 flex gap-3 text-xs">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 text-accent hover:underline"
            >
              <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
              Réessayer
            </button>
            <button
              type="button"
              onClick={onDiscard}
              className="inline-flex items-center gap-1 text-muted hover:text-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Supprimer
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

/** L'état d'un message envoyé, en bas à droite de la bulle, comme sur WhatsApp. */
function StatusMark({ status }: { status: Status }) {
  if (status === "failed") {
    return (
      <span className="mt-1 flex items-center justify-end gap-1 text-xs text-danger">
        <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
        Non envoyé
      </span>
    );
  }
  const Icon = status === "sending" ? Clock : Check;
  const label = status === "sending" ? "Envoi…" : "Envoyé";
  return (
    <span className="mt-1 flex justify-end opacity-75" title={label}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
