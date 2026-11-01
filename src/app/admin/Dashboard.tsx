"use client";

import {
  ArrowRight,
  BarChart3,
  ChevronLeft,
  Eye,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Settings,
  ShieldCheck,
  TicketPercent,
  UserCog,
  Users,
  UsersRound,
  Wrench,
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Emblem } from "../Logo";
import { ThemeToggle } from "../ThemeToggle";
import { AdminsSection } from "./admins";
import { api, SignedOut } from "./api";
import { BetaRequestsSection } from "./beta";
import { MaintenanceSection } from "./maintenance";
import { initials, levelOf, type Me } from "./permissions";
import { ProfileSection } from "./profile";
import { PromoSection } from "./promo";
import {
  CostsSection,
  OverviewSection,
  TeamsSection,
  UsersSection,
} from "./sections";
import { FeedbackSection, SettingsSection } from "./settings";
import {
  ErrorText,
  Field,
  inputClass,
  PasswordInput,
  ReadOnlyContext,
} from "./ui";

/** Les sections du menu, regroupées par thème. */
const GROUPS = [
  {
    label: "Pilotage",
    items: [
      { id: "vue-d-ensemble", label: "Vue d'ensemble", icon: LayoutDashboard },
      { id: "couts", label: "Coûts d'IA", icon: BarChart3 },
    ],
  },
  {
    label: "Clients",
    items: [
      { id: "utilisateurs", label: "Utilisateurs", icon: Users },
      { id: "equipes", label: "Équipes", icon: UsersRound },
      { id: "retours", label: "Retours", icon: MessageSquareText },
    ],
  },
  {
    label: "Bêta et offres",
    items: [
      { id: "demandes", label: "Demandes de bêta", icon: Inbox },
      { id: "codes", label: "Codes promo", icon: TicketPercent },
    ],
  },
  {
    label: "Plateforme",
    items: [
      { id: "maintenance", label: "Maintenance", icon: Wrench },
      { id: "reglages", label: "Réglages", icon: Settings },
      { id: "comptes", label: "Équipe interne", icon: UserCog },
    ],
  },
] as const;

type Section = (typeof GROUPS)[number]["items"][number];

const SECTIONS: readonly Section[] = GROUPS.flatMap(
  (group): readonly Section[] => group.items,
);

/** Le profil n'est pas dans le menu : on l'ouvre en cliquant sur son nom, en bas. */
type SectionId = (typeof SECTIONS)[number]["id"] | "profil";

const sectionFromHash = (): SectionId => {
  const hash =
    typeof window === "undefined" ? "" : window.location.hash.slice(1);
  if (hash === "profil") return "profil";
  return SECTIONS.find((item) => item.id === hash)?.id ?? "vue-d-ensemble";
};

/** La vue d'ensemble et le profil sont ouverts à tous ; les autres sections, selon les droits. */
const canOpen = (me: Me | null, id: SectionId) =>
  id === "vue-d-ensemble" ||
  id === "profil" ||
  (!!me && levelOf(me.permissions, id) !== "none");

/** Section accordée en lecture seule à ce compte. */
const readOnlyFor = (me: Me | null, id: SectionId) =>
  !!me &&
  id !== "vue-d-ensemble" &&
  id !== "profil" &&
  levelOf(me.permissions, id) === "read";

/** Le tableau de bord d'administration de <br/>, réservé à l'équipe interne. */
export function Dashboard() {
  const [state, setState] = useState<"checking" | "signedOut" | "signedIn">(
    "checking",
  );
  const [section, setSection] = useState<SectionId>("vue-d-ensemble");
  const [collapsed, setCollapsed] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const signedOut = useCallback(() => setState("signedOut"), []);

  // Le compte connecté : son nom en bas du menu, ses droits pour les sections.
  const loadMe = useCallback(async () => {
    const response = await fetch("/api/admin/session").catch(() => null);
    const json = response?.ok
      ? ((await response.json()) as { admin?: Me })
      : null;
    setMe(json?.admin ?? null);
  }, []);

  useEffect(() => {
    if (state === "signedIn") void loadMe();
  }, [state, loadMe]);

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
    if (!canOpen(me, id)) return;
    window.location.hash = id;
    setSection(id);
  };
  // Une adresse vers une section interdite revient à la vue d'ensemble.
  const shown = me && !canOpen(me, section) ? "vue-d-ensemble" : section;
  const groups = GROUPS.map((group) => ({
    label: group.label,
    items: group.items.filter((item) => !me || canOpen(me, item.id)),
  })).filter((group) => group.items.length > 0);

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

        <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Sections">
          {groups.map((group, index) => (
            <div key={group.label} className={index > 0 ? "mt-5" : ""}>
              {collapsed ? (
                index > 0 && <hr className="mx-2 mb-3 border-border" />
              ) : (
                <p className="mb-1.5 px-3 text-xs font-semibold tracking-wide text-muted uppercase">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = shown === item.id;
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
                      <item.icon
                        className="h-5 w-5 shrink-0"
                        aria-hidden="true"
                      />
                      {!collapsed && (
                        <span className="flex-1 text-left">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="flex flex-col gap-2 border-t border-border p-3">
          {collapsed ? (
            <ThemeToggle className="mx-auto" />
          ) : (
            <ThemeToggle withLabel className="w-full justify-center" />
          )}
          <button
            type="button"
            onClick={() => go("profil")}
            aria-current={shown === "profil" ? "page" : undefined}
            title="Mon profil"
            className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent-soft ${
              shown === "profil" ? "bg-accent-soft" : ""
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
              {me ? (
                initials(me.name)
              ) : (
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              )}
            </span>
            {!collapsed && (
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {me?.name ?? "Équipe interne"}
                </span>
                <span className="block truncate text-xs text-muted">
                  {me?.email ?? ""}
                </span>
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/admin/session", { method: "DELETE" });
              setState("signedOut");
            }}
            title={collapsed ? "Déconnexion" : undefined}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center border-b border-border bg-card px-6">
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
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <ReadOnlyContext.Provider value={readOnlyFor(me, shown)}>
            <div className="mx-auto max-w-7xl">
              {readOnlyFor(me, shown) && (
                <p className="mb-4 flex items-center gap-2 rounded-lg bg-accent-soft px-4 py-2.5 text-sm">
                  <Eye
                    className="h-4 w-4 shrink-0 text-accent"
                    aria-hidden="true"
                  />
                  Lecture seule : vous pouvez consulter cette section, sans la
                  modifier.
                </p>
              )}
              {shown === "vue-d-ensemble" && (
                <OverviewSection onSignedOut={signedOut} onOpen={go} />
              )}
              {shown === "utilisateurs" && (
                <UsersSection onSignedOut={signedOut} />
              )}
              {shown === "equipes" && <TeamsSection onSignedOut={signedOut} />}
              {shown === "couts" && <CostsSection onSignedOut={signedOut} />}
              {shown === "codes" && <PromoSection onSignedOut={signedOut} />}
              {shown === "demandes" && (
                <BetaRequestsSection onSignedOut={signedOut} />
              )}
              {shown === "retours" && (
                <FeedbackSection onSignedOut={signedOut} />
              )}
              {shown === "maintenance" && (
                <MaintenanceSection onSignedOut={signedOut} />
              )}
              {shown === "comptes" && (
                <AdminsSection
                  onSignedOut={signedOut}
                  selfId={me?.id ?? null}
                />
              )}
              {shown === "reglages" && (
                <SettingsSection onSignedOut={signedOut} />
              )}
              {shown === "profil" && me && (
                <ProfileSection me={me} onSaved={loadMe} />
              )}
            </div>
          </ReadOnlyContext.Provider>
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
    <div className="relative flex min-h-screen flex-col items-center px-4 py-6">
      <div className="absolute top-6 right-6">
        <ThemeToggle withLabel />
      </div>

      <Emblem className="h-44 w-44 sm:h-52 sm:w-52" />
      <h1 className="mt-2 text-center text-3xl font-bold tracking-tight sm:text-4xl">
        Retour à la ligne
      </h1>
      <p className="mt-2 max-w-md text-center text-base text-muted">
        Redonner un sens au travail d'équipe.
      </p>

      <main className="mt-6 w-full max-w-md rounded-3xl bg-card p-8 shadow-lg shadow-accent/5 ring-1 ring-border sm:p-10">
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
              required
              autoComplete="username"
              className={`${inputClass} h-11`}
              placeholder="nom@exemple.org"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field label="Mot de passe">
            <PasswordInput
              autoComplete="current-password"
              className="h-11"
              value={password}
              onChange={setPassword}
            />
          </Field>
          <ErrorText>{error}</ErrorText>
          <button
            type="submit"
            disabled={busy}
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
