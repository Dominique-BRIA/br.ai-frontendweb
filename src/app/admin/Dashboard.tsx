"use client";

import {
  ArrowRight,
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
import { Emblem } from "../Logo";
import { ThemeToggle } from "../ThemeToggle";
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
import { ErrorText, Field, inputClass } from "./ui";

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
  const [adminName, setAdminName] = useState<string | null>(null);
  const signedOut = useCallback(() => setState("signedOut"), []);

  // Le nom du compte connecté, pour la barre du haut.
  useEffect(() => {
    if (state !== "signedIn") return;
    fetch("/api/admin/session")
      .then((response) => (response.ok ? response.json() : null))
      .then((json: { admin?: { name: string } } | null) =>
        setAdminName(json?.admin?.name ?? null),
      )
      .catch(() => setAdminName(null));
  }, [state]);

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
    return <div className="min-h-screen bg-background" />;
  if (state === "signedOut")
    return <SignIn onSignedIn={() => setState("signedIn")} />;

  const go = (id: SectionId) => {
    window.location.hash = id;
    setSection(id);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <aside
        className={`flex shrink-0 flex-col border-r border-border bg-card transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-border px-4">
          <Emblem className="h-12 w-12 shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-mono text-base font-bold">
                {"<br/>"}
              </p>
              <p className="truncate text-xs text-muted">Administration</p>
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
                    ? "bg-accent-soft text-accent"
                    : "text-muted hover:bg-accent-soft"
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

        <div className="border-t border-border p-2">
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/admin/session", { method: "DELETE" });
              setState("signedOut");
            }}
            title={collapsed ? "Déconnexion" : undefined}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
            className="rounded-lg p-2 text-muted hover:bg-accent-soft"
          >
            {collapsed ? (
              <Menu className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="hidden text-sm text-muted sm:inline">
              {adminName ?? "Équipe interne"}
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

/**
 * Connexion de l'équipe interne : l'emblème en haut, le nom et la devise juste en dessous,
 * puis la carte de connexion par adresse e-mail et mot de passe.
 */
function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    }).catch(() => null);
    setBusy(false);
    if (response?.ok) {
      setPassword("");
      onSignedIn();
      return;
    }
    const json = await response?.json().catch(() => ({}));
    setError(json?.error ?? "Connexion impossible.");
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center px-4 py-12">
      <div className="absolute top-6 right-6">
        <ThemeToggle withLabel />
      </div>

      <Emblem className="mt-4 h-32 w-32 sm:h-36 sm:w-36" />
      <h1 className="mt-6 text-center text-4xl font-bold tracking-tight sm:text-5xl">
        Retour à la ligne
      </h1>
      <p className="mt-4 max-w-md text-center text-lg text-muted">
        Redonner un sens au travail d'équipe.
      </p>

      <main className="mt-10 w-full max-w-md rounded-3xl bg-card p-8 shadow-lg shadow-accent/5 ring-1 ring-border sm:p-10">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent ring-1 ring-accent/20">
          <ShieldCheck className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Administration</h2>
        <p className="mt-2 mb-6 text-muted">
          Espace réservé à l'équipe interne de {"<br/>"}.
        </p>
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <Field label="Adresse e-mail">
            <input
              type="email"
              autoComplete="username"
              className={`${inputClass} h-11`}
              placeholder="nom@exemple.org"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field label="Mot de passe">
            <input
              type="password"
              autoComplete="current-password"
              className={`${inputClass} h-11`}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          <ErrorText>{error}</ErrorText>
          <button
            type="submit"
            disabled={busy || !email.trim() || !password}
            className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-50"
          >
            Se connecter
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </main>
    </div>
  );
}
