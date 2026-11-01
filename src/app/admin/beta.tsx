"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { api, dateTime, useAdminData } from "./api";
import {
  Badge,
  Button,
  Card,
  Cell,
  ErrorText,
  PageHeader,
  Row,
  Table,
} from "./ui";

interface BetaRequest {
  id: string;
  email: string;
  inviteCode: string | null;
  invitedAt: string | null;
  createdAt: string;
}

/** Demandes d'accès laissées sur la page d'accueil : un clic envoie le code d'invitation. */
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

  const invite = async (request: BetaRequest) => {
    setSending(request.id);
    setSendError(null);
    try {
      await api(`beta-requests/${request.id}/invite`, { method: "POST" });
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
                  {request.inviteCode ? (
                    <Badge tone="success">
                      Invitée le {dateTime(request.invitedAt)}
                    </Badge>
                  ) : (
                    <Badge tone="warm">En attente</Badge>
                  )}
                </Cell>
                <Cell>
                  {request.inviteCode ? (
                    <span className="font-mono text-xs text-muted">
                      {request.inviteCode}
                    </span>
                  ) : (
                    <Button
                      kind="primary"
                      icon={Send}
                      disabled={sending !== null}
                      onClick={() => void invite(request)}
                    >
                      {sending === request.id ? "Envoi…" : "Inviter"}
                    </Button>
                  )}
                </Cell>
              </Row>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
