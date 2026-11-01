"use client";

import { KeyRound, Power, UserPlus, Wand2 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { api, dateTime, useAdminData } from "./api";
import {
  Badge,
  Button,
  Card,
  Cell,
  ErrorText,
  Field,
  inputClass,
  PageHeader,
  Row,
  Table,
} from "./ui";

interface Admin {
  id: string;
  email: string;
  name: string;
  lastLoginAt: string | null;
  disabledAt: string | null;
  createdAt: string;
}

/** Lettres et chiffres sans les caractères qui se confondent (0/O, 1/l/I). */
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generatePassword(length = 16): string {
  const values = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(values, (value) => ALPHABET[value % ALPHABET.length]).join(
    "",
  );
}

/** Les comptes de l'équipe interne : ajouter un collègue, désactiver un compte, son mot de passe. */
export function AdminsSection({ onSignedOut }: { onSignedOut: () => void }) {
  const { data, error, reload } = useAdminData<{ admins: Admin[] }>(
    "admins",
    onSignedOut,
  );
  const [selfId, setSelfId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((response) => (response.ok ? response.json() : null))
      .then((json: { admin?: { id: string } } | null) =>
        setSelfId(json?.admin?.id ?? null),
      )
      .catch(() => setSelfId(null));
  }, []);

  const setDisabled = async (admin: Admin, disabled: boolean) => {
    setActionError(null);
    try {
      await api(`admins/${admin.id}`, { method: "PATCH", body: { disabled } });
      await reload();
    } catch (cause) {
      setActionError((cause as Error).message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Équipe interne"
        subtitle="Les comptes qui ont accès au tableau de bord"
      />
      <Card title="Comptes">
        <ErrorText>{error ?? actionError}</ErrorText>
        {data && (
          <Table head={["Nom", "Adresse", "Dernière connexion", "Statut", ""]}>
            {data.admins.map((admin) => (
              <Row key={admin.id} muted={!!admin.disabledAt}>
                <Cell strong>
                  {admin.name}
                  {admin.id === selfId && (
                    <span className="ml-2 text-xs font-normal text-muted">
                      (vous)
                    </span>
                  )}
                </Cell>
                <Cell mono>{admin.email}</Cell>
                <Cell>{dateTime(admin.lastLoginAt)}</Cell>
                <Cell>
                  {admin.disabledAt ? (
                    <Badge tone="danger">Désactivé</Badge>
                  ) : (
                    <Badge tone="success">Actif</Badge>
                  )}
                </Cell>
                <Cell>
                  {admin.id !== selfId && (
                    <Button
                      kind={admin.disabledAt ? "outline" : "danger"}
                      icon={Power}
                      onClick={() => void setDisabled(admin, !admin.disabledAt)}
                    >
                      {admin.disabledAt ? "Réactiver" : "Désactiver"}
                    </Button>
                  )}
                </Cell>
              </Row>
            ))}
          </Table>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <AddAdmin onAdded={reload} />
        <ChangePassword />
      </div>
    </div>
  );
}

function AddAdmin({ onAdded }: { onAdded: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    name: string;
    password: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setCreated(null);
    try {
      await api("admins", {
        method: "POST",
        body: { name: name.trim(), email: email.trim(), password },
      });
      setCreated({ name: name.trim(), password });
      setName("");
      setEmail("");
      setPassword("");
      await onAdded();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      title="Ajouter un collègue"
      description="Il se connecte avec ce mot de passe provisoire, puis le change ici."
    >
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <Field label="Nom affiché">
          <input
            required
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="Adresse e-mail">
          <input
            required
            type="email"
            className={inputClass}
            placeholder="nom@exemple.org"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Mot de passe provisoire (12 caractères au moins)">
          <div className="flex gap-2">
            <input
              required
              minLength={12}
              className={`${inputClass} min-w-0 flex-1 font-mono`}
              autoComplete="off"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Button
              icon={Wand2}
              onClick={() => setPassword(generatePassword())}
            >
              Générer
            </Button>
          </div>
        </Field>
        <ErrorText>{error}</ErrorText>
        {created && (
          <p className="rounded-lg bg-accent-soft p-3 text-sm">
            Compte de {created.name} créé. Transmettez-lui le mot de passe{" "}
            <span className="font-mono font-semibold">{created.password}</span>{" "}
            de vive voix ou par un canal sûr : il ne sera plus affiché.
          </p>
        )}
        <div>
          <Button kind="primary" type="submit" icon={UserPlus} disabled={busy}>
            {busy ? "Création…" : "Créer le compte"}
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
      title="Mon mot de passe"
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
