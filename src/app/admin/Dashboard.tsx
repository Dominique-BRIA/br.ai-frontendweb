"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
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
  { id: "overview", label: "Vue d'ensemble" },
  { id: "users", label: "Utilisateurs" },
  { id: "teams", label: "Équipes" },
  { id: "costs", label: "Coûts d'IA" },
  { id: "promo", label: "Codes promo" },
  { id: "feedback", label: "Retours" },
  { id: "maintenance", label: "Maintenance" },
  { id: "settings", label: "Réglages" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/** Le tableau de bord d'administration de <br>.ia, réservé à l'équipe interne. */
export function Dashboard() {
  const [state, setState] = useState<"checking" | "signedOut" | "signedIn">(
    "checking",
  );
  const [section, setSection] = useState<SectionId>("overview");
  const signedOut = useCallback(() => setState("signedOut"), []);

  useEffect(() => {
    api("overview")
      .then(() => setState("signedIn"))
      .catch((error) =>
        setState(error instanceof SignedOut ? "signedOut" : "signedIn"),
      );
  }, []);

  if (state === "checking")
    return <p className="p-8 text-muted">Chargement…</p>;
  if (state === "signedOut")
    return <SignIn onSignedIn={() => setState("signedIn")} />;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* biome-ignore lint/performance/noImgElement: petite image fixe, inutile de passer par l'optimiseur. */}
          <img
            src="/logo-symbole.png"
            alt=""
            width={36}
            height={36}
            className="rounded-md"
          />
          <div>
            <p className="font-mono text-sm text-muted">{"<br>.ia"}</p>
            <h1 className="text-lg font-semibold">Tableau de bord</h1>
          </div>
        </div>
        <Button
          onClick={async () => {
            await fetch("/api/admin/session", { method: "DELETE" });
            setState("signedOut");
          }}
        >
          Se déconnecter
        </Button>
      </header>
      <nav
        className="flex flex-wrap gap-1 border-b border-border"
        aria-label="Sections"
      >
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSection(item.id)}
            aria-current={section === item.id ? "page" : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              section === item.id
                ? "border-accent font-semibold text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <main>
        {section === "overview" && <OverviewSection onSignedOut={signedOut} />}
        {section === "users" && <UsersSection onSignedOut={signedOut} />}
        {section === "teams" && <TeamsSection onSignedOut={signedOut} />}
        {section === "costs" && <CostsSection onSignedOut={signedOut} />}
        {section === "promo" && <PromoSection onSignedOut={signedOut} />}
        {section === "feedback" && <FeedbackSection onSignedOut={signedOut} />}
        {section === "maintenance" && (
          <MaintenanceSection onSignedOut={signedOut} />
        )}
        {section === "settings" && <SettingsSection onSignedOut={signedOut} />}
      </main>
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
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-16">
      {/* biome-ignore lint/performance/noImgElement: petite image fixe, inutile de passer par l'optimiseur. */}
      <img src="/logo-complet.jpg" alt="<br>.ia" className="rounded-md" />
      <h1 className="text-xl font-semibold">Tableau de bord</h1>
      <p className="text-sm text-muted">
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
  );
}
