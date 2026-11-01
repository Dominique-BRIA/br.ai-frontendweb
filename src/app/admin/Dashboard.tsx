"use client";

import {
  BarChart3,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Settings,
  ShieldCheck,
  TicketPercent,
  Users,
  UsersRound,
  Wrench,
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Logo } from "../Logo";
import { api, SignedOut } from "./api";
import { MaintenanceSection } from "./maintenance";
import { PromoSection } from "./promo";
import {
  CostsSection,
  OverviewSection,
  TeamsSection,
  UsersSection,
} from "./sections";
import { FeedbackSection, SettingsSection } from "./settings";
import { Button, ErrorText, inputClass } from "./ui";

const SECTIONS = [
  { id: "vue-d-ensemble", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "utilisateurs", label: "Utilisateurs", icon: Users },
  { id: "equipes", label: "Équipes", icon: UsersRound },
  { id: "couts", label: "Coûts d'IA", icon: BarChart3 },
  { id: "codes", label: "Codes promo", icon: TicketPercent },
  { id: "retours", label: "Retours", icon: MessageSquareText },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "reglages", label: "Réglages", icon: Settings },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const sectionFromHash = (): SectionId => {
  const hash =
    typeof window === "undefined" ? "" : window.location.hash.slice(1);
  return SECTIONS.find((item) => item.id === hash)?.id ?? "vue-d-ensemble";
};

/** Le tableau de bord d'administration de <br/>, réservé à l'équipe interne. */
export function Dashboard() {
  const [state, setState] = useState<"checking" | "signedOut" | "signedIn">(
    "checking",
  );
  const [section, setSection] = useState<SectionId>("vue-d-ensemble");
  const [collapsed, setCollapsed] = useState(false);
  const signedOut = useCallback(() => setState("signedOut"), []);

  useEffect(() => {
    // La section suit l'adresse (#utilisateurs…) : une page rechargée y revient.
    setSection(sectionFromHash());
    const onHash = () => setSection(sectionFromHash());
    window.addEventListener("hashchange", onHash);
    api("overview")
      .then(() => setState("signedIn"))
      .catch((error) =>
        setState(error instanceof SignedOut ? "signedOut" : "signedIn"),
      );
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (state === "checking")
    return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950" />;
  if (state === "signedOut")
    return <SignIn onSignedIn={() => setState("signedIn")} />;

  const go = (id: SectionId) => {
    window.location.hash = id;
    setSection(id);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <aside
        className={`flex shrink-0 flex-col border-r border-zinc-200 bg-white transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-900 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-zinc-200 px-4 dark:border-zinc-800">
          {/* biome-ignore lint/performance/noImgElement: petite image fixe, inutile de passer par l'optimiseur. */}
          <img
            src="/logo-symbole.png"
            alt=""
            width={36}
            height={36}
            className="shrink-0 rounded-lg shadow-sm"
          />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-mono text-base font-bold">
                {"<br/>"}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                Administration
              </p>
            </div>
          )}
        </div>

        <nav
          className="flex-1 space-y-1 overflow-y-auto px-2 py-4"
          aria-label="Sections"
        >
          {SECTIONS.map((item) => {
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#1860a0]/10 text-[#1860a0] dark:bg-[#5896d8]/15 dark:text-[#8cbbec]"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {!collapsed && (
                  <span className="flex-1 text-left">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/admin/session", { method: "DELETE" });
              setState("signedOut");
            }}
            title={collapsed ? "Déconnexion" : undefined}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            {collapsed ? (
              <Menu className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-zinc-500 sm:inline dark:text-zinc-400">
              Équipe interne
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#1860a0] to-[#0e385e] text-white">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            {section === "vue-d-ensemble" && (
              <OverviewSection onSignedOut={signedOut} onOpen={go} />
            )}
            {section === "utilisateurs" && (
              <UsersSection onSignedOut={signedOut} />
            )}
            {section === "equipes" && <TeamsSection onSignedOut={signedOut} />}
            {section === "couts" && <CostsSection onSignedOut={signedOut} />}
            {section === "codes" && <PromoSection onSignedOut={signedOut} />}
            {section === "retours" && (
              <FeedbackSection onSignedOut={signedOut} />
            )}
            {section === "maintenance" && (
              <MaintenanceSection onSignedOut={signedOut} />
            )}
            {section === "reglages" && (
              <SettingsSection onSignedOut={signedOut} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/** Connexion par le jeton d'administration (variable ADMIN_TOKEN du serveur). */
function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token.trim() }),
    }).catch(() => null);
    setBusy(false);
    if (response?.ok) {
      onSignedIn();
      return;
    }
    const json = await response?.json().catch(() => ({}));
    setError(json?.error ?? "Connexion impossible.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <main className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-200/70 dark:bg-zinc-900 dark:ring-zinc-800">
        <Logo className="mx-auto mb-6 h-auto w-36" />
        <h1 className="text-center text-xl font-bold tracking-tight">
          Administration
        </h1>
        <p className="mt-1 mb-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Réservé à l'équipe interne. Saisissez le jeton d'administration du
          serveur.
        </p>
        <form className="flex flex-col gap-3" onSubmit={submit}>
          <input
            type="password"
            autoComplete="off"
            className={inputClass}
            placeholder="Jeton d'administration"
            aria-label="Jeton d'administration"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
          <ErrorText>{error}</ErrorText>
          <Button kind="primary" type="submit" disabled={busy || !token.trim()}>
            Se connecter
          </Button>
        </form>
      </main>
    </div>
  );
}
