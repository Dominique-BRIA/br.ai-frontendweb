"use client";

import { Bell, Folder, LogOut, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Emblem } from "../../Logo";
import { ThemeToggle } from "../../ThemeToggle";
import type { LiveEvent, Notification, Workspace } from "./types";

/** Version du protocole temps réel du serveur <br/>. */
const PROTOCOL_VERSION = 3;
/** Le navigateur se présente comme une machine, sans dossier ni projet : il n'est jamais cuisinier. */
const BROWSER = {
  id: "web",
  os: "other",
  editor: "Navigateur",
  editorVersion: "web",
  extensionVersion: "web",
};
const SEEN_KEY = "bria-notifications-vues";

interface AppContextValue {
  workspace: Workspace | null;
  live: boolean;
  /** Appelle le serveur <br/> par le relais du site. */
  api: <T>(
    path: string,
    init?: { method?: string; body?: unknown },
  ) => Promise<T>;
  subscribe: (listener: (event: LiveEvent) => void) => () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp hors de la plateforme.");
  return value;
}

/** Session expirée ou révoquée : on la ferme côté site, puis retour à l'accueil. */
const signOutAndLeave = () => window.location.assign("/api/auth/logout");

async function api<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`/api/app/${path}`, {
    method: init.method ?? "GET",
    headers:
      init.body === undefined
        ? undefined
        : { "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  }).catch(() => null);
  if (!response) throw new Error("Le serveur <br/> ne répond pas.");
  if (response.status === 401) {
    signOutAndLeave();
    throw new Error("Session expirée.");
  }
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.error?.message ?? "La demande n'a pas abouti.");
  }
  return json as T;
}

/**
 * Le cadre de la plateforme : l'en-tête, la liste des projets, les notifications, et la
 * connexion temps réel partagée par toutes les pages.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const listeners = useRef(new Set<(event: LiveEvent) => void>());

  const subscribe = useCallback((listener: (event: LiveEvent) => void) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const loadWorkspace = useCallback(async () => {
    try {
      setWorkspace(await api<Workspace>("workspace"));
      setError(null);
    } catch (cause) {
      setError((cause as Error).message);
    }
  }, []);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  // Connexion temps réel, rouverte avec un nouveau ticket après chaque coupure.
  useEffect(() => {
    let socket: WebSocket | null = null;
    let ping: ReturnType<typeof setInterval> | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let delay = 2000;
    let stopped = false;

    const connect = async () => {
      const response = await fetch("/api/realtime", { method: "POST" }).catch(
        () => null,
      );
      if (stopped) return;
      if (response?.status === 401) return signOutAndLeave();
      if (!response?.ok) return scheduleRetry();
      const { ticket, url } = (await response.json()) as {
        ticket: string;
        url: string;
      };
      socket = new WebSocket(url);
      socket.onopen = () => {
        socket?.send(
          JSON.stringify({
            type: "hello",
            protocolVersion: PROTOCOL_VERSION,
            ticket,
            machine: BROWSER,
          }),
        );
      };
      socket.onmessage = (raw) => {
        let event: LiveEvent;
        try {
          event = JSON.parse(String(raw.data)) as LiveEvent;
        } catch {
          return;
        }
        if (event.type === "welcome") {
          setLive(true);
          delay = 2000;
          ping = setInterval(() => {
            socket?.send(JSON.stringify({ type: "ping", sentAt: Date.now() }));
          }, 25_000);
        }
        if (event.type === "workspace.changed") void loadWorkspace();
        for (const listener of listeners.current) listener(event);
      };
      socket.onclose = () => {
        setLive(false);
        clearInterval(ping);
        if (!stopped) scheduleRetry();
      };
    };
    const scheduleRetry = () => {
      retry = setTimeout(() => void connect(), delay);
      delay = Math.min(delay * 2, 30_000);
    };

    void connect();
    return () => {
      stopped = true;
      clearTimeout(retry);
      clearInterval(ping);
      socket?.close();
    };
  }, [loadWorkspace]);

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    window.location.assign("/");
  };

  return (
    <AppContext.Provider value={{ workspace, live, api, subscribe }}>
      <div className="flex h-dvh flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
          <Link href="/app" className="flex items-center gap-2">
            <Emblem className="h-9 w-9" />
            <span className="font-mono text-lg font-semibold">{"<br/>"}</span>
          </Link>
          <div className="flex items-center gap-2">
            {workspace && (
              <span className="hidden text-sm text-muted sm:inline">
                {workspace.user.displayName}
              </span>
            )}
            {workspace && (
              <Notifications userId={workspace.user.id} subscribe={subscribe} />
            )}
            <ThemeToggle lang="fr" />
            <button
              type="button"
              onClick={() => void signOut()}
              title="Se déconnecter"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-card px-3 text-sm font-semibold ring-1 ring-border transition-colors hover:text-accent"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Se déconnecter</span>
            </button>
          </div>
        </header>
        <div className="flex min-h-0 flex-1">
          {/* La liste lit l'adresse pour marquer le projet ouvert : Next veut une zone de chargement. */}
          <Suspense
            fallback={
              <div className="hidden w-64 shrink-0 border-r border-border lg:block" />
            }
          >
            <ProjectList workspace={workspace} />
          </Suspense>
          <main className="min-w-0 flex-1 overflow-y-auto">
            {error && !workspace ? (
              <p role="alert" className="p-6 text-danger">
                {error}
              </p>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
}

/** Les équipes et leurs projets, toujours visibles sur grand écran. */
function ProjectList({ workspace }: { workspace: Workspace | null }) {
  const pathname = usePathname();
  return (
    <nav
      className="hidden w-64 shrink-0 overflow-y-auto border-r border-border p-4 lg:block"
      aria-label="Projets"
    >
      {workspace?.teams.map((team) => (
        <div key={team.id} className="mb-5">
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {team.name}
          </p>
          <ul>
            {team.projects.map((project) => {
              const href = `/app/p/${project.id}`;
              const current = pathname === href;
              return (
                <li key={project.id}>
                  <Link
                    href={href}
                    aria-current={current ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                      current
                        ? "bg-accent-soft font-semibold text-foreground"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    <Folder className="h-4 w-4" aria-hidden="true" />
                    <span className="truncate">{project.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** La cloche : mentions, réponses et commandes terminées. */
function Notifications({
  userId,
  subscribe,
}: {
  userId: string;
  subscribe: AppContextValue["subscribe"];
}) {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string>(() => {
    try {
      return localStorage.getItem(SEEN_KEY) ?? "";
    } catch {
      return "";
    }
  });

  const load = useCallback(async () => {
    try {
      const { notifications } = await api<{ notifications: Notification[] }>(
        "me/notifications",
      );
      setItems(notifications);
    } catch {
      // La cloche reste telle quelle ; le chat signale déjà les coupures.
    }
  }, []);

  useEffect(() => {
    void load();
    return subscribe((event) => {
      if (event.type === "order.updated") void load();
      if (
        event.type === "message.created" &&
        "message" in event &&
        event.message.mentions.includes(userId)
      ) {
        void load();
      }
    });
  }, [load, subscribe, userId]);

  const unread = items.filter((item) => item.createdAt > seen).length;
  const toggle = () => {
    setOpen((value) => !value);
    const latest = items[0]?.createdAt;
    if (latest && latest > seen) {
      setSeen(latest);
      try {
        localStorage.setItem(SEEN_KEY, latest);
      } catch {
        // Sans stockage, le compteur repart à la prochaine visite.
      }
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        title="Notifications"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-card ring-1 ring-border transition-colors hover:text-accent"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Notifications</span>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-warm px-1 text-center text-xs font-semibold text-background">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 max-h-[70vh] w-80 overflow-y-auto rounded-2xl bg-card p-2 shadow-xl ring-1 ring-border">
          {items.length === 0 && (
            <p className="p-3 text-sm text-muted">Aucune notification.</p>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setOpen(false);
                router.push(`/app/p/${item.projectId}`);
              }}
              className="block w-full rounded-xl p-3 text-left hover:bg-accent-soft"
            >
              <span className="block text-sm font-semibold">{item.author}</span>
              <span className="line-clamp-2 block text-sm text-muted">
                {item.text}
              </span>
              <span className="mt-1 block text-xs text-muted">
                {item.projectName} · {item.teamName}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
