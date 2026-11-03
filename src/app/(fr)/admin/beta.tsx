"use client";

import { RotateCw, Send } from "lucide-react";
import { useState } from "react";
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

interface BetaRequest {
  id: string;
  email: string;
  inviteCode: string | null;
  invitedAt: string | null;
  joined: boolean;
  createdAt: string;
}

/** Demandes laissées sur la page d'accueil : on choisit les crédits offerts, puis un clic envoie le code. */
export function BetaRequestsSection({
  onSignedOut,
}: {
  onSignedOut: () => void;
}) {
  const { data, error, reload } = useAdminData<{ requests: BetaRequest[] }>(
    "beta-requests",
    onSignedOut,
  );
  const [sending, setSending] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [credits, setCredits] = useState("");
  const [months, setMonths] = useState("1");
  const offer = { credits: Number(credits), months: Number(months) };
  const offerValid =
    Number.isInteger(offer.credits) &&
    offer.credits > 0 &&
    Number.isInteger(offer.months) &&
    offer.months > 0;

  const send = async (request: BetaRequest) => {
    setSending(request.id);
    setSendError(null);
    const action = request.inviteCode ? "resend" : "invite";
    try {
      await api(`beta-requests/${request.id}/${action}`, {
        method: "POST",
        // Un code encore valable repart tel quel, sans montant à ressaisir.
        body: offerValid ? offer : {},
      });
      await reload();
    } catch (cause) {
      setSendError((cause as Error).message);
    } finally {
      setSending(null);
    }
  };

  const waiting = data?.requests.filter((request) => !request.inviteCode);

  return (
    <>
      <PageHeader
        title="Demandes de bêta"
        subtitle={
          waiting
            ? `${waiting.length} en attente · le code part par e-mail, valable 30 jours`
            : "Laissées sur la page d'accueil du site"
        }
      />
      <Card title="Crédits offerts par le code">
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Crédits par mois">
            <input
              className={inputClass}
              inputMode="numeric"
              value={credits}
              onChange={(event) => setCredits(event.target.value)}
            />
          </Field>
          <Field label="Pendant (mois)">
            <input
              className={inputClass}
              inputMode="numeric"
              value={months}
              onChange={(event) => setMonths(event.target.value)}
            />
          </Field>
        </div>
      </Card>
      <Card title="Adresses reçues">
        <ErrorText>{error ?? sendError}</ErrorText>
        {data?.requests.length === 0 && (
          <p className="text-sm text-muted">Aucune demande pour l'instant.</p>
        )}
        {!!data?.requests.length && (
          <Table head={["Adresse", "Reçue le", "Statut", ""]}>
            {data.requests.map((request) => (
              <Row key={request.id} muted={!!request.inviteCode}>
                <Cell mono strong>
                  {request.email}
                </Cell>
                <Cell>{dateTime(request.createdAt)}</Cell>
                <Cell>
                  {request.joined ? (
                    <Badge tone="accent">Code utilisé</Badge>
                  ) : request.inviteCode ? (
                    <Badge tone="success">
                      Invitée le {dateTime(request.invitedAt)}
                    </Badge>
                  ) : (
                    <Badge tone="warm">En attente</Badge>
                  )}
                </Cell>
                <Cell>
                  <div className="flex items-center justify-end gap-3">
                    {request.inviteCode && (
                      <span className="font-mono text-xs text-muted">
                        {request.inviteCode}
                      </span>
                    )}
                    {!request.joined && (
                      <Button
                        kind={request.inviteCode ? "outline" : "primary"}
                        icon={request.inviteCode ? RotateCw : Send}
                        disabled={
                          sending !== null ||
                          (!request.inviteCode && !offerValid)
                        }
                        onClick={() => void send(request)}
                      >
                        {sending === request.id
                          ? "Envoi…"
                          : request.inviteCode
                            ? "Renvoyer"
                            : "Inviter"}
                      </Button>
                    )}
                  </div>
                </Cell>
              </Row>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
