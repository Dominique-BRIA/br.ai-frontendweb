"use client";

import { Copy, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { api, dateTime, useAdminData } from "./api";
import {
  Badge,
  Button,
  Card,
  Cell,
  ErrorText,
  Field,
  inputClass,
  Row,
  Table,
  Writable,
} from "./ui";

interface CloudMachine {
  id: string;
  label: string;
  createdAt: string;
  lastSeenAt: string;
  online: boolean;
}

/**
 * Machines cloud du cuisinier : enregistrer une machine donne un jeton, affiché une seule fois,
 * à coller dans le script d'installation sur la VM.
 */
export function CloudMachinesCard({
  onSignedOut,
}: {
  onSignedOut: () => void;
}) {
  const { data, error, reload } = useAdminData<{ machines: CloudMachine[] }>(
    "cloud-machines",
    onSignedOut,
  );
  const [label, setLabel] = useState("gcp-e2-micro");
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFailure(null);
    setCopied(false);
    try {
      const answer = await api<{ token: string }>("cloud-machines", {
        method: "POST",
        body: { label: label.trim() },
      });
      setToken(answer.token);
      await reload();
    } catch (cause) {
      setFailure((cause as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (machine: CloudMachine) => {
    if (
      !window.confirm(
        `Retirer la machine « ${machine.label} » ? Elle sera déconnectée.`,
      )
    )
      return;
    setFailure(null);
    try {
      await api(`cloud-machines/${machine.id}`, { method: "DELETE" });
      await reload();
    } catch (cause) {
      setFailure((cause as Error).message);
    }
  };

  const copy = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
    } catch {
      setFailure(
        "La copie n'a pas fonctionné : sélectionnez le jeton à la main.",
      );
    }
  };

  return (
    <Card title="Machines cloud du cuisinier">
      <p className="mb-3 text-sm text-muted">
        Elles réalisent les commandes que les membres jugent non sensibles, sans
        machine allumée chez eux.
      </p>
      <ErrorText>{error ?? failure}</ErrorText>
      {!!data?.machines.length && (
        <Table
          head={["Machine", "Enregistrée le", "Dernière activité", "État", ""]}
        >
          {data.machines.map((machine) => (
            <Row key={machine.id}>
              <Cell mono strong>
                {machine.label}
              </Cell>
              <Cell>{dateTime(machine.createdAt)}</Cell>
              <Cell>{dateTime(machine.lastSeenAt)}</Cell>
              <Cell>
                <Badge tone={machine.online ? "success" : "warm"}>
                  {machine.online ? "En ligne" : "Hors ligne"}
                </Badge>
              </Cell>
              <Cell>
                <Writable>
                  <Button
                    kind="danger"
                    icon={Trash2}
                    onClick={() => void remove(machine)}
                  >
                    Retirer
                  </Button>
                </Writable>
              </Cell>
            </Row>
          ))}
        </Table>
      )}
      {token && (
        <div className="my-3 rounded-xl p-3 ring-1 ring-warm">
          <p className="text-sm font-semibold">
            Jeton de la machine : copiez-le maintenant, il ne sera plus affiché.
          </p>
          <code className="mt-2 block font-mono text-sm break-all">
            {token}
          </code>
          <div className="mt-2">
            <Button kind="outline" icon={Copy} onClick={() => void copy()}>
              {copied ? "Copié" : "Copier"}
            </Button>
          </div>
        </div>
      )}
      <Writable>
        <form onSubmit={create} className="mt-3 flex flex-wrap items-end gap-3">
          <Field label="Nom de la machine">
            <input
              className={inputClass}
              value={label}
              maxLength={60}
              onChange={(event) => setLabel(event.target.value)}
            />
          </Field>
          <Button
            kind="primary"
            type="submit"
            icon={Plus}
            disabled={busy || !label.trim()}
          >
            Enregistrer une machine
          </Button>
        </form>
      </Writable>
    </Card>
  );
}
