"use client";

import {
  ArrowLeft,
  CornerUpLeft,
  Lightbulb,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import Link from "next/link";
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
import { Markdown } from "./Markdown";
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
  const [sending, setSending] = useState(false);
  const list = useRef<HTMLDivElement>(null);
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
        }
        if (
          event.type === "memory.changed" &&
          "projectId" in event &&
          event.projectId === projectId
        ) {
          void loadMemory();
        }
      }),
    [subscribe, projectId, add, loadMemory],
  );

  // On suit le bas du fil, sauf si le membre est remonté lire les anciens messages.
  useEffect(() => {
    const element = list.current;
    if (element && atBottom.current && messages.length > 0)
      element.scrollTop = element.scrollHeight;
  }, [messages]);

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

  const send = async (event?: FormEvent) => {
    event?.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    const lower = body.toLowerCase();
    const mentions = (team?.members ?? [])
      .filter((member) => member.userId !== workspace?.user.id)
      .filter((member) =>
        lower.includes(`@${member.displayName.toLowerCase()}`),
      )
      .map((member) => member.userId);
    setSending(true);
    try {
      const { message } = await api<{ message: Message }>(
        `projects/${projectId}/messages`,
        {
          method: "POST",
          body: {
            body,
            mentions,
            ...(replyTo ? { replyToId: replyTo.id } : {}),
          },
        },
      );
      atBottom.current = true;
      add([message]);
      setDraft("");
      setReplyTo(null);
      setError(null);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setSending(false);
    }
  };

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
      void send();
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
    <div className="flex h-full min-h-0">
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
          <Link
            href="/app"
            className="text-muted hover:text-foreground lg:hidden"
            title="Retour aux projets"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-semibold">{project?.name ?? "…"}</h1>
            <p className="truncate text-xs text-muted">
              {team?.name}
              {!live && " · reconnexion…"}
            </p>
          </div>
        </div>

        <div
          ref={list}
          onScroll={(event) => {
            const element = event.currentTarget;
            atBottom.current =
              element.scrollHeight - element.scrollTop - element.clientHeight <
              80;
          }}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6"
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
                  myUserId={workspace?.user.id ?? ""}
                  onReply={() => setReplyTo(message)}
                />
              </div>
            );
          })}
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
              disabled={sending || !draft.trim()}
              title="Envoyer"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-foreground text-background transition hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Envoyer</span>
            </button>
          </div>
        </form>
      </section>

      <aside
        className="hidden w-72 shrink-0 overflow-y-auto border-l border-border p-4 xl:block"
        aria-label="Mémoire du projet"
      >
        <h2 className="flex items-center gap-2 font-semibold">
          <Lightbulb className="h-4 w-4 text-accent" aria-hidden="true" />
          Mémoire du projet
        </h2>
        {open.length === 0 && (
          <p className="mt-3 text-sm text-muted">
            Les décisions, questions et tâches notées par le serveur
            apparaîtront ici.
          </p>
        )}
        {(Object.keys(MEMORY_TITLES) as MemoryItem["type"][]).map((type) => {
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
        })}
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
  onReply,
}: {
  message: Message;
  myUserId: string;
  onReply: () => void;
}) {
  const mine =
    message.author.kind === "member" && message.author.userId === myUserId;
  const agent = isAgent(message.author);
  const mentionsMe = message.mentions.includes(myUserId);
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
          <button
            type="button"
            onClick={onReply}
            title="Répondre"
            className="text-muted opacity-0 transition-opacity hover:text-foreground focus:opacity-100 group-hover:opacity-100"
          >
            <CornerUpLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">Répondre</span>
          </button>
        </div>
        <div className={`min-w-0 max-w-full rounded-2xl px-4 py-2.5 ${bubble}`}>
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
        </div>
      </div>
    </article>
  );
}
