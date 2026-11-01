"use client";

import { type FormEvent, useState } from "react";
import { api, date, useAdminData } from "./api";
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

interface PromoCode {
  id: string;
  code: string;
  kind: string;
  planId: string | null;
  durationMonths: number | null;
  forever: boolean;
  credits: number | null;
  trialDays: number | null;
  percent: number | null;
  amountCents: number | null;
  expiresAt: string | null;
  maxUses: number | null;
  usesCount: number;
  sort: string;
  batch: string | null;
  note: string | null;
  disabled: boolean;
}

const KINDS: Record<string, string> = {
  plan: "Formule offerte",
  trial: "Essai d'une formule",
  credits: "Crédits en bonus",
  percent: "Réduction en %",
  amount: "Réduction d'un montant",
  beta: "Invitation à la bêta",
};

/** Ce que fait un code, en quelques mots. */
function effect(code: PromoCode): string {
  const duration = code.forever
    ? "sans fin"
    : code.durationMonths
      ? `${code.durationMonths} mois`
      : "une fois";
  switch (code.kind) {
    case "plan":
      return `${code.planId} · ${duration}`;
    case "trial":
      return `${code.planId} · ${code.trialDays} jours`;
    case "credits":
      return `${code.credits} crédits · ${duration}`;
    case "percent":
      return `${code.percent} % · ${duration}`;
    case "amount":
      return `${((code.amountCents ?? 0) / 100).toFixed(2)} $ · ${duration}`;
    default:
      return "";
  }
}

/** Codes promotionnels : création (seule ou en lot), suivi des utilisations, désactivation. */
export function PromoSection({ onSignedOut }: { onSignedOut: () => void }) {
  const { data, error, reload } = useAdminData<{ codes: PromoCode[] }>(
    "promo-codes",
    onSignedOut,
  );
  const plans = useAdminData<{ plans: { id: string; name: string }[] }>(
    "plans",
    onSignedOut,
  );
  const [created, setCreated] = useState<string[]>([]);

  const toggle = async (code: PromoCode) => {
    await api(`promo-codes/${code.id}`, {
      method: "PATCH",
      body: { disabled: !code.disabled },
    });
    await reload();
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Codes promo"
        subtitle="Formules offertes, essais, crédits en bonus et réductions"
      />
      <Card
        title="Nouveau code"
        description="Un code choisi, ou un lot de codes uniques générés"
      >
        <PromoForm
          plans={plans.data?.plans ?? []}
          onCreated={async (codes) => {
            setCreated(codes);
            await reload();
          }}
        />
        {created.length > 0 && (
          <div className="mt-3 rounded-md border border-accent p-3">
            <p className="mb-2 text-sm font-medium">
              {created.length} code(s) créé(s) :
            </p>
            <textarea
              readOnly
              className={`${inputClass} w-full font-mono`}
              rows={Math.min(created.length, 8)}
              value={created.join("\n")}
            />
          </div>
        )}
      </Card>
      <Card title="Codes existants">
        <ErrorText>{error}</ErrorText>
        <Table
          head={[
            "Code",
            "Sorte",
            "Effet",
            "Utilisations",
            "Expiration",
            "Conditions",
            "",
          ]}
        >
          {data?.codes.map((code) => (
            <Row key={code.id} muted={code.disabled}>
              <Cell mono>{code.code}</Cell>
              <Cell>{KINDS[code.kind] ?? code.kind}</Cell>
              <Cell>{effect(code)}</Cell>
              <Cell>
                {code.usesCount}
                {code.maxUses !== null && ` / ${code.maxUses}`}
              </Cell>
              <Cell>{date(code.expiresAt)}</Cell>
              <Cell>
                <span className="flex flex-wrap gap-1">
                  {code.sort !== "public" && (
                    <Badge>
                      {code.sort === "unique" ? "lot" : "parrainage"}
                    </Badge>
                  )}
                  {code.note && <span className="text-muted">{code.note}</span>}
                </span>
              </Cell>
              <Cell>
                <Button
                  kind={code.disabled ? "outline" : "danger"}
                  onClick={() => void toggle(code)}
                >
                  {code.disabled ? "Réactiver" : "Désactiver"}
                </Button>
              </Cell>
            </Row>
          ))}
        </Table>
      </Card>
    </div>
  );
}

function PromoForm({
  plans,
  onCreated,
}: {
  plans: { id: string; name: string }[];
  onCreated: (codes: string[]) => void;
}) {
  const [kind, setKind] = useState("credits");
  const [code, setCode] = useState("");
  const [count, setCount] = useState("1");
  const [prefix, setPrefix] = useState("BRIA");
  const [planId, setPlanId] = useState("equipe");
  const [months, setMonths] = useState("");
  const [forever, setForever] = useState(false);
  const [amount, setAmount] = useState("");
  const [days, setDays] = useState("14");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [newOnly, setNewOnly] = useState(false);
  const [sort, setSort] = useState("public");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const numberOrUndefined = (value: string) =>
    value ? Number(value) : undefined;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { codes } = await api<{ codes: string[] }>("promo-codes", {
        method: "POST",
        body: {
          kind,
          code: code || undefined,
          count: Number(count) || 1,
          prefix,
          planId: kind === "plan" || kind === "trial" ? planId : undefined,
          durationMonths:
            kind === "trial" || forever ? undefined : numberOrUndefined(months),
          forever: kind === "plan" && forever,
          credits: kind === "credits" ? numberOrUndefined(amount) : undefined,
          percent: kind === "percent" ? numberOrUndefined(amount) : undefined,
          amountCents:
            kind === "amount" && amount
              ? Math.round(Number(amount) * 100)
              : undefined,
          trialDays: kind === "trial" ? numberOrUndefined(days) : undefined,
          expiresAt: expiresAt
            ? new Date(`${expiresAt}T23:59:59Z`).toISOString()
            : undefined,
          maxUses: numberOrUndefined(maxUses),
          newCustomersOnly: newOnly,
          sort,
          note: note || undefined,
        },
      });
      onCreated(codes);
      setCode("");
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={submit}>
      <div className="grid gap-3 md:grid-cols-4">
        <Field label="Sorte">
          <select
            className={inputClass}
            value={kind}
            onChange={(event) => setKind(event.target.value)}
          >
            {Object.entries(KINDS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        {(kind === "plan" || kind === "trial") && (
          <Field label="Formule">
            <select
              className={inputClass}
              value={planId}
              onChange={(event) => setPlanId(event.target.value)}
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {(kind === "credits" || kind === "percent" || kind === "amount") && (
          <Field
            label={
              kind === "credits"
                ? "Crédits"
                : kind === "percent"
                  ? "Pourcentage"
                  : "Montant ($)"
            }
          >
            <input
              className={inputClass}
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </Field>
        )}
        {kind === "trial" && (
          <Field label="Jours d'essai">
            <input
              className={inputClass}
              inputMode="numeric"
              value={days}
              onChange={(event) => setDays(event.target.value)}
            />
          </Field>
        )}
        {kind !== "trial" && kind !== "beta" && (
          <Field label="Durée en mois (vide : une fois)">
            <input
              className={inputClass}
              inputMode="numeric"
              value={months}
              disabled={forever}
              onChange={(event) => setMonths(event.target.value)}
            />
          </Field>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <Field label="Code (vide : généré)">
          <input
            className={`${inputClass} font-mono`}
            value={code}
            disabled={Number(count) > 1}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
          />
        </Field>
        <Field label="Nombre de codes (lot)">
          <input
            className={inputClass}
            inputMode="numeric"
            value={count}
            onChange={(event) => setCount(event.target.value)}
          />
        </Field>
        <Field label="Préfixe des codes générés">
          <input
            className={`${inputClass} font-mono`}
            value={prefix}
            onChange={(event) => setPrefix(event.target.value.toUpperCase())}
          />
        </Field>
        <Field label="Utilisations au plus">
          <input
            className={inputClass}
            inputMode="numeric"
            value={maxUses}
            onChange={(event) => setMaxUses(event.target.value)}
          />
        </Field>
        <Field label="Expire le">
          <input
            type="date"
            className={inputClass}
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
          />
        </Field>
        <Field label="Diffusion">
          <select
            className={inputClass}
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="public">Public</option>
            <option value="referral">Parrainage</option>
          </select>
        </Field>
        <Field label="Note interne">
          <input
            className={inputClass}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={newOnly}
            onChange={(event) => setNewOnly(event.target.checked)}
          />
          Nouvelles équipes seulement
        </label>
        {kind === "plan" && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={forever}
              onChange={(event) => setForever(event.target.checked)}
            />
            Sans fin (réservé à l'équipe interne)
          </label>
        )}
      </div>
      <ErrorText>{error}</ErrorText>
      <div>
        <Button kind="primary" type="submit" disabled={busy}>
          Créer
        </Button>
      </div>
    </form>
  );
}
