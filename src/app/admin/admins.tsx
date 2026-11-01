"use client";

import { Check, Pencil, Power, UserPlus, Wand2, X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { api, dateTime, useAdminData } from "./api";
import { PERMISSIONS, type Permission } from "./permissions";
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
  permissions: string[];
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

const isFull = (permissions: readonly string[]) =>
  PERMISSIONS.every((permission) => permissions.includes(permission.id));

/** Les cases à cocher des sections : à la création d'un compte et pour modifier ses accès. */
function PermissionPicker({
  value,
  onChange,
}: {
  value: Permission[];
  onChange: (value: Permission[]) => void;
}) {
  const toggle = (id: Permission) =>
    onChange(
      value.includes(id) ? value.filter((item) => item !== id) : [...value, id],
    );
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3 text-xs">
        <button
          type="button"
          className="font-medium text-accent hover:underline"
          onClick={() =>
            onChange(PERMISSIONS.map((permission) => permission.id))
          }
        >
          Tout cocher
        </button>
        <button
          type="button"
          className="font-medium text-muted hover:underline"
          onClick={() => onChange([])}
        >
          Tout décocher
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {PERMISSIONS.map((permission) => (
          <label
            key={permission.id}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent-soft"
          >
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--primary)]"
              checked={value.includes(permission.id)}
              onChange={() => toggle(permission.id)}
            />
            {permission.label}
          </label>
        ))}
      </div>
      <p className="text-xs text-muted">
        La vue d'ensemble et le profil restent ouverts à tous les comptes.
      </p>
    </div>
  );
}

function AccessBadges({ permissions }: { permissions: string[] }) {
  if (isFull(permissions))
    return <Badge tone="accent">Tout le tableau de bord</Badge>;
  const granted = PERMISSIONS.filter((permission) =>
    permissions.includes(permission.id),
  );
  if (granted.length === 0)
    return <span className="text-sm text-muted">Vue d'ensemble seule</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {granted.map((permission) => (
        <Badge key={permission.id}>{permission.label}</Badge>
      ))}
    </div>
  );
}

/** Les comptes de l'équipe interne : ajouter un collègue, régler ses accès, le désactiver. */
export function AdminsSection({
  onSignedOut,
  selfId,
}: {
  onSignedOut: () => void;
  selfId: string | null;
}) {
  const { data, error, reload } = useAdminData<{ admins: Admin[] }>(
    "admins",
    onSignedOut,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{
    id: string;
    permissions: Permission[];
  } | null>(null);

  const update = async (
    admin: Admin,
    body: { disabled?: boolean; permissions?: Permission[] },
  ) => {
    setActionError(null);
    try {
      await api(`admins/${admin.id}`, { method: "PATCH", body });
      setEditing(null);
      await reload();
    } catch (cause) {
      setActionError((cause as Error).message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Équipe interne"
        subtitle="Les comptes qui ont accès au tableau de bord, et ce que chacun peut y faire"
      />
      <Card title="Comptes">
        <ErrorText>{error ?? actionError}</ErrorText>
        {data && (
          <Table head={["Nom", "Accès", "Dernière connexion", "Statut", ""]}>
            {data.admins.map((admin) => {
              const self = admin.id === selfId;
              const open = editing?.id === admin.id;
              return (
                <Row key={admin.id} muted={!!admin.disabledAt}>
                  <Cell strong>
                    {admin.name}
                    {self && (
                      <span className="ml-2 text-xs font-normal text-muted">
                        (vous)
                      </span>
                    )}
                    <span className="block font-mono text-xs font-normal text-muted">
                      {admin.email}
                    </span>
                  </Cell>
                  <Cell>
                    {open && editing ? (
                      <div className="flex min-w-72 flex-col gap-3">
                        <PermissionPicker
                          value={editing.permissions}
                          onChange={(permissions) =>
                            setEditing({ id: admin.id, permissions })
                          }
                        />
                        <div className="flex gap-2">
                          <Button
                            kind="primary"
                            icon={Check}
                            onClick={() =>
                              void update(admin, {
                                permissions: editing.permissions,
                              })
                            }
                          >
                            Enregistrer
                          </Button>
                          <Button
                            kind="ghost"
                            icon={X}
                            onClick={() => setEditing(null)}
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <AccessBadges permissions={admin.permissions} />
                    )}
                  </Cell>
                  <Cell>{dateTime(admin.lastLoginAt)}</Cell>
                  <Cell>
                    {admin.disabledAt ? (
                      <Badge tone="danger">Désactivé</Badge>
                    ) : (
                      <Badge tone="success">Actif</Badge>
                    )}
                  </Cell>
                  <Cell>
                    {!self && !open && (
                      <div className="flex justify-end gap-2">
                        <Button
                          icon={Pencil}
                          onClick={() =>
                            setEditing({
                              id: admin.id,
                              permissions: admin.permissions.filter(
                                (permission): permission is Permission =>
                                  PERMISSIONS.some(
                                    (item) => item.id === permission,
                                  ),
                              ),
                            })
                          }
                        >
                          Accès
                        </Button>
                        <Button
                          kind={admin.disabledAt ? "outline" : "danger"}
                          icon={Power}
                          onClick={() =>
                            void update(admin, { disabled: !admin.disabledAt })
                          }
                        >
                          {admin.disabledAt ? "Réactiver" : "Désactiver"}
                        </Button>
                      </div>
                    )}
                  </Cell>
                </Row>
              );
            })}
          </Table>
        )}
      </Card>

      <AddAdmin onAdded={reload} />
    </div>
  );
}

function AddAdmin({ onAdded }: { onAdded: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>([]);
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
        body: { name: name.trim(), email: email.trim(), password, permissions },
      });
      setCreated({ name: name.trim(), password });
      setName("");
      setEmail("");
      setPassword("");
      setPermissions([]);
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
      description="Il se connecte avec ce mot de passe provisoire, puis le change dans son profil. Ses accès restent modifiables ensuite."
    >
      <form className="grid gap-6 lg:grid-cols-2" onSubmit={submit}>
        <div className="flex flex-col gap-4">
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
        </div>
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-muted">Accès</span>
          <PermissionPicker value={permissions} onChange={setPermissions} />
        </div>
        <div className="flex flex-col gap-3 lg:col-span-2">
          <ErrorText>{error}</ErrorText>
          {created && (
            <p className="rounded-lg bg-accent-soft p-3 text-sm">
              Compte de {created.name} créé. Transmettez-lui le mot de passe{" "}
              <span className="font-mono font-semibold">
                {created.password}
              </span>{" "}
              de vive voix ou par un canal sûr : il ne sera plus affiché.
            </p>
          )}
          <div>
            <Button
              kind="primary"
              type="submit"
              icon={UserPlus}
              disabled={busy}
            >
              {busy ? "Création…" : "Créer le compte"}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
