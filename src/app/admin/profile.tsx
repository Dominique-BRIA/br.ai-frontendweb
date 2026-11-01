"use client";

import { KeyRound, Save } from "lucide-react";
import { type FormEvent, useState } from "react";
import { AccessBadges } from "./access";
import { initials, type Me } from "./permissions";
import { Button, Card, ErrorText, Field, inputClass, PageHeader } from "./ui";

/** Le profil du compte connecté : ses informations, son mot de passe et ses accès. */
export function ProfileSection({
  me,
  onSaved,
}: {
  me: Me;
  onSaved: () => Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Mon profil" subtitle="Vos informations de connexion" />
      <div className="flex items-center gap-4 rounded-xl bg-card p-5 shadow-sm ring-1 ring-border">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-white">
          {initials(me.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{me.name}</p>
          <p className="truncate text-sm text-muted">{me.email}</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Information me={me} onSaved={onSaved} />
        <ChangePassword />
      </div>
      <Card
        title="Mes accès"
        description="Seul un compte qui gère l'équipe interne peut les modifier."
      >
        <AccessBadges grants={me.permissions} />
      </Card>
    </div>
  );
}

function Information({
  me,
  onSaved,
}: {
  me: Me;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(me.name);
  const [email, setEmail] = useState(me.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const emailChanged = email.trim().toLowerCase() !== me.email;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setDone(false);
    const response = await fetch("/api/admin/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        ...(emailChanged && { email: email.trim(), currentPassword: password }),
      }),
    }).catch(() => null);
    setBusy(false);
    if (response?.ok) {
      setPassword("");
      setDone(true);
      await onSaved();
      return;
    }
    const json = await response?.json().catch(() => ({}));
    setError(
      json?.error?.message ?? json?.error ?? "L'enregistrement a échoué.",
    );
  };

  return (
    <Card title="Mes informations">
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <Field label="Nom affiché">
          <input
            required
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="Adresse e-mail (sert à vous connecter)">
          <input
            required
            type="email"
            className={inputClass}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        {emailChanged && (
          <Field label="Mot de passe actuel, pour confirmer la nouvelle adresse">
            <input
              required
              type="password"
              autoComplete="current-password"
              className={inputClass}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
        )}
        <ErrorText>{error}</ErrorText>
        {done && <p className="text-sm text-accent">Profil enregistré.</p>}
        <div>
          <Button kind="primary" type="submit" icon={Save} disabled={busy}>
            {busy ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setDone(false);
    if (next !== confirm) {
      setError("Les deux nouveaux mots de passe ne sont pas identiques.");
      return;
    }
    setBusy(true);
    setError(null);
    const response = await fetch("/api/admin/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    }).catch(() => null);
    setBusy(false);
    if (response?.ok) {
      setCurrent("");
      setNext("");
      setConfirm("");
      setDone(true);
      return;
    }
    const json = await response?.json().catch(() => ({}));
    setError(
      json?.error?.message ?? json?.error ?? "Le changement n'a pas abouti.",
    );
  };

  return (
    <Card
      title="Mot de passe"
      description="Vos autres sessions ouvertes seront fermées."
    >
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <Field label="Mot de passe actuel">
          <input
            required
            type="password"
            autoComplete="current-password"
            className={inputClass}
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
          />
        </Field>
        <Field label="Nouveau mot de passe (12 caractères au moins)">
          <input
            required
            minLength={12}
            type="password"
            autoComplete="new-password"
            className={inputClass}
            value={next}
            onChange={(event) => setNext(event.target.value)}
          />
        </Field>
        <Field label="Nouveau mot de passe, à nouveau">
          <input
            required
            minLength={12}
            type="password"
            autoComplete="new-password"
            className={inputClass}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </Field>
        <ErrorText>{error}</ErrorText>
        {done && <p className="text-sm text-accent">Mot de passe changé.</p>}
        <div>
          <Button kind="primary" type="submit" icon={KeyRound} disabled={busy}>
            {busy ? "Enregistrement…" : "Changer le mot de passe"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
