"use client";

import { useEffect, useState } from "react";
import { api, dateTime, useAdminData } from "./api";
import {
  Badge,
  Button,
  Card,
  Cell,
  ErrorText,
  inputClass,
  Locked,
  PageHeader,
  Row,
  Table,
} from "./ui";

interface Feedback {
  id: string;
  text: string;
  status: "new" | "in_progress" | "done";
  extensionVersion: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
}

const STATUS: Record<
  Feedback["status"],
  { label: string; tone: "accent" | "warm" | "slate" }
> = {
  new: { label: "Nouveau", tone: "accent" },
  in_progress: { label: "En cours", tone: "warm" },
  done: { label: "Traité", tone: "slate" },
};

/** Retours des testeurs, avec leur statut. */
export function FeedbackSection({ onSignedOut }: { onSignedOut: () => void }) {
  const { data, error, reload } = useAdminData<{ feedback: Feedback[] }>(
    "feedback",
    onSignedOut,
  );

  const setStatus = async (item: Feedback, status: Feedback["status"]) => {
    await api(`feedback/${item.id}`, { method: "PATCH", body: { status } });
    await reload();
  };

  return (
    <>
      <PageHeader
        title="Retours des testeurs"
        subtitle="Envoyés depuis l'extension, avec leur statut"
      />
      <Card title="Retours des testeurs">
        <ErrorText>{error}</ErrorText>
        {data?.feedback.length === 0 && (
          <p className="text-sm text-muted">Aucun retour pour l'instant.</p>
        )}
        <ul className="flex flex-col gap-3">
          {data?.feedback.map((item) => (
            <li key={item.id} className="rounded-md border border-border p-3">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-sm">
                <Badge tone={STATUS[item.status].tone}>
                  {STATUS[item.status].label}
                </Badge>
                <span className="font-medium">
                  {item.userName ?? "Ancien membre"}
                </span>
                {item.userEmail && (
                  <span className="font-mono text-muted">{item.userEmail}</span>
                )}
                <span className="text-muted">
                  {dateTime(item.createdAt)}
                  {item.extensionVersion &&
                    ` · extension ${item.extensionVersion}`}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{item.text}</p>
              <div className="mt-2 flex gap-2">
                {(["new", "in_progress", "done"] as const)
                  .filter((status) => status !== item.status)
                  .map((status) => (
                    <Button
                      key={status}
                      onClick={() => void setStatus(item, status)}
                    >
                      {STATUS[status].label}
                    </Button>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

interface Plan {
  id: string;
  name: string;
  maxMembers: number;
  maxProjects: number;
  monthlyCredits: number;
}

interface Rate {
  input: number;
  output: number;
}

/** Réglages : formules et quotas, barème des crédits. */
export function SettingsSection({ onSignedOut }: { onSignedOut: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Réglages"
        subtitle="Formules, quotas et barème des crédits"
      />
      <Locked>
        <PlansCard onSignedOut={onSignedOut} />
        <RatesCard onSignedOut={onSignedOut} />
      </Locked>
    </div>
  );
}

function PlansCard({ onSignedOut }: { onSignedOut: () => void }) {
  const { data, error, reload } = useAdminData<{ plans: Plan[] }>(
    "plans",
    onSignedOut,
  );
  const [drafts, setDrafts] = useState<Record<string, Plan>>({});
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    if (data)
      setDrafts(Object.fromEntries(data.plans.map((plan) => [plan.id, plan])));
  }, [data]);

  const update = (id: string, key: keyof Plan, value: string) =>
    setDrafts((current) => {
      const plan = current[id];
      if (!plan) return current;
      return {
        ...current,
        [id]: {
          ...plan,
          [key]: key === "name" ? value : Number(value.replace(/\D/g, "")),
        },
      };
    });

  const save = async (plan: Plan) => {
    const { id, ...changes } = plan;
    await api(`plans/${id}`, { method: "PATCH", body: changes });
    setSaved(id);
    await reload();
  };

  return (
    <Card title="Formules et quotas">
      <ErrorText>{error}</ErrorText>
      <Table
        head={[
          "Formule",
          "Membres au plus",
          "Projets au plus",
          "Crédits par mois",
          "",
        ]}
      >
        {Object.values(drafts).map((plan) => (
          <Row key={plan.id}>
            <Cell>
              <input
                className={inputClass}
                value={plan.name}
                onChange={(event) =>
                  update(plan.id, "name", event.target.value)
                }
              />
            </Cell>
            {(["maxMembers", "maxProjects", "monthlyCredits"] as const).map(
              (key) => (
                <Cell key={key}>
                  <input
                    className={`${inputClass} w-28`}
                    inputMode="numeric"
                    value={plan[key]}
                    onChange={(event) =>
                      update(plan.id, key, event.target.value)
                    }
                  />
                </Cell>
              ),
            )}
            <Cell>
              <Button onClick={() => void save(plan)}>
                {saved === plan.id ? "Enregistré" : "Enregistrer"}
              </Button>
            </Cell>
          </Row>
        ))}
      </Table>
    </Card>
  );
}

function RatesCard({ onSignedOut }: { onSignedOut: () => void }) {
  const { data, error } = useAdminData<{
    rates: { default: Rate; models: Record<string, Rate> };
  }>("credit-rates", onSignedOut);
  const [text, setText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    if (data) setText(JSON.stringify(data.rates, null, 2));
  }, [data]);

  const save = async () => {
    setFailure(null);
    setMessage(null);
    try {
      await api("credit-rates", { method: "PUT", body: JSON.parse(text) });
      setMessage("Barème enregistré : il s'applique aux prochains appels.");
    } catch (cause) {
      setFailure(
        cause instanceof SyntaxError
          ? "Le barème n'est pas un JSON valide."
          : (cause as Error).message,
      );
    }
  };

  return (
    <Card title="Barème des crédits">
      <p className="mb-2 text-sm text-muted">
        Crédits pour 1000 jetons, en entrée (input) et en sortie (output). «
        default » s'applique à tous les modèles ; ajoutez dans « models » un
        tarif pour un modèle précis, sous la forme « fournisseur:modèle ».
      </p>
      <ErrorText>{error}</ErrorText>
      <textarea
        className={`${inputClass} w-full font-mono`}
        rows={10}
        value={text}
        onChange={(event) => setText(event.target.value)}
        aria-label="Barème des crédits"
      />
      <div className="mt-2 flex items-center gap-3">
        <Button kind="primary" onClick={() => void save()}>
          Enregistrer
        </Button>
        {message && <span className="text-sm text-accent">{message}</span>}
        <ErrorText>{failure}</ErrorText>
      </div>
    </Card>
  );
}
