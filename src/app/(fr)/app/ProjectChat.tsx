"use client";

import {
  Check,
  CircleAlert,
  Clock,
  CornerUpLeft,
  FolderOpen,
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
import { FilesPanel } from "./FilesPanel";
import { Markdown } from "./Markdown";
import { OrderDetails, OrdersPanel, useProjectOrders } from "./OrdersPanel";
import {
  type Author,
  authorName,
  isAgent,
  type MemoryItem,
  type Message,
  type Order,
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
/** Vercel refuse les requêtes de plus de 4,5 Mo : au-delà, l'envoi passe par VS Code. */
const WEB_UPLOAD_MAX = 4 * 1024 * 1024;
const MAX_FILES = 10;
const ACCEPTED =
  ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.odp,.ods,.txt,.md,.csv,.json,.html,.png,.jpg,.jpeg,.gif,.webp,.zip";

interface Outgoing {
  attachments: Message["attachments"];
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
  const [pending, setPending] = useState<Message["attachments"]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  /** Envoie les fichiers choisis ; ils partent avec le prochain message. */
  const attach = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const room = MAX_FILES - pending.length;
    const chosen = Array.from(files).slice(0, Math.max(0, room));
    if (chosen.length < files.length) {
      setError(`${MAX_FILES} fichiers au plus par message.`);
    }
    setUploading(true);
    try {
      for (const file of chosen) {
        if (file.size > WEB_UPLOAD_MAX) {
          setError(
            `« ${file.name} » dépasse 4 Mo : envoie-le depuis VS Code, qui accepte 20 Mo.`,
          );
          continue;
        }
        const response = await fetch(
          `/api/app/projects/${projectId}/attachments`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/octet-stream",
              "x-file-name": encodeURIComponent(file.name),
              "x-file-type": file.type || "application/octet-stream",
            },
            body: file,
          },
        );
        if (!response.ok) {
          setError(`« ${file.name} » n'a pas pu être envoyé.`);
          continue;
        }
        const { attachment } = (await response.json()) as {
          attachment: Message["attachments"][number];
        };
        setPending((current) => [...current, attachment]);
      }
    } catch {
      setError("Envoi du fichier impossible : vérifie ta connexion.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };
  const [panel, setPanel] = useState<"memory" | "orders" | "files">("memory");
  const { orders } = useProjectOrders(projectId);
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
            attachmentIds: item.attachments.map((file) => file.id),
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
    if ((!body && pending.length === 0) || uploading) return;
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
      attachments: pending,
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
    setPending([]);
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
                  orders={orders}
                  message={message}
                  myUserId={myUserId}
                  onReply={() => setReplyTo(message)}
                />
              </div>
            );
          })}
          {outgoing.map((item) => (
            <MessageItem
              orders={orders}
              key={item.clientId}
              message={{
                id: item.clientId,
                projectId,
                author: { kind: "member", userId: myUserId, displayName: "" },
                body: item.body,
                replyTo: item.replyTo,
                mentions: item.mentions,
                attachments: item.attachments,
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
          {(pending.length > 0 || uploading) && (
            <ul className="mb-2 flex flex-wrap gap-2">
              {pending.map((file) => (
                <li
                  key={file.id}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-card px-2 py-1 text-sm ring-1 ring-border"
                >
                  <Paperclip
                    className="h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPending((current) =>
                        current.filter((entry) => entry.id !== file.id),
                      )
                    }
                    title={`Retirer ${file.name}`}
                    className="text-muted hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only">Retirer {file.name}</span>
                  </button>
                </li>
              ))}
              {uploading && (
                <li className="inline-flex items-center gap-1.5 px-2 py-1 text-sm text-muted">
                  <LoaderCircle
                    className="h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                  Envoi du fichier…
                </li>
              )}
            </ul>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={fileInput}
              type="file"
              multiple
              accept={ACCEPTED}
              className="hidden"
              onChange={(event) => void attach(event.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading || pending.length >= MAX_FILES}
              title="Joindre un document (l'IA peut le lire)"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-field text-muted transition hover:text-foreground disabled:opacity-50"
            >
              <Paperclip className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Joindre un document</span>
            </button>
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
              disabled={(!draft.trim() && pending.length === 0) || uploading}
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
        aria-label="Mémoire, commandes et fichiers du projet"
      >
        <div className="flex items-center gap-1">
          {(
            [
              ["memory", "Mémoire", Lightbulb],
              ["orders", "Commandes", ListChecks],
              ["files", "Fichiers", FolderOpen],
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
          {panel === "files" ? (
            <FilesPanel projectId={projectId} />
          ) : panel === "orders" ? (
            <OrdersPanel
              hasRepo={Boolean(project?.repo)}
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
  orders,
  message,
  myUserId,
  status,
  onReply,
  onRetry,
  onDiscard,
}: {
  orders?: Order[];
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
  // Le message où le cuisinier prend la commande : ses étapes sont consultables juste dessous.
  const taken =
    message.author.kind === "cuisinier"
      ? /^Je (?:commence|reprends) la \*\*commande n° (\d+)\*\*/.exec(
          message.body,
        )
      : null;
  const takenOrder = taken
    ? orders?.find((order) => order.number === Number(taken[1]))
    : undefined;
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
        {takenOrder && <OrderDetails order={takenOrder} />}
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
