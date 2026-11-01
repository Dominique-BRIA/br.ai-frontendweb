"use client";

import { type FormEvent, useEffect, useState } from "react";
import { api, dateTime, useAdminData } from "./api";
import { Badge, Button, Card, ErrorText, Field, inputClass } from "./ui";

interface Maintenance {
  startsAt: string;
  durationMinutes: number;
  messageFr: string;
  messageEn: string;
  exceptions: string[];
}

interface Status {
  state: "none" | "scheduled" | "ongoing";
  startsAt: string | null;
  endsAt: string | null;
}

/** Valeur d'un champ datetime-local (heure locale) pour une date. */
function localInput(date: Date): string {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

/**
 * Mode maintenance : programmer (début, durée, messages en français et en anglais, comptes
 * qui gardent l'accès), suivre l'état, et rouvrir d'un clic.
 */
export function MaintenanceSection({
  onSignedOut,
}: {
  onSignedOut: () => void;
}) {
  const { data, error, reload } = useAdminData<{
    maintenance: Maintenance | null;
    status: Status;
  }>("maintenance", onSignedOut);
  const [startsAt, setStartsAt] = useState(() =>
    localInput(new Date(Date.now() + 24 * 3_600_000)),
  );
  const [duration, setDuration] = useState("30");
  const [messageFr, setMessageFr] = useState("Mise à jour de la plateforme.");
  const [messageEn, setMessageEn] = useState("Platform update.");
  const [exceptions, setExceptions] = useState("");
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const current = data?.maintenance;
    if (!current) return;
    setStartsAt(localInput(new Date(current.startsAt)));
    setDuration(String(current.durationMinutes));
    setMessageFr(current.messageFr);
    setMessageEn(current.messageEn);
    setExceptions(current.exceptions.join("\n"));
  }, [data]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFailure(null);
    try {
      await api("maintenance", {
        method: "PUT",
        body: {
          startsAt: new Date(startsAt).toISOString(),
          durationMinutes: Number(duration),
          messageFr,
          messageEn,
          exceptions: exceptions
            .split(/[\s,;]+/)
            .map((value) => value.trim())
            .filter(Boolean),
        },
      });
      await reload();
    } catch (cause) {
      setFailure((cause as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const reopen = async () => {
    if (
      !window.confirm(
        "Rouvrir la plateforme maintenant ? Les membres seront prévenus.",
      )
    )
      return;
    await api("maintenance", { method: "DELETE" });
    await reload();
  };

  const status = data?.status;
  return (
    <div className="flex flex-col gap-4">
      <Card title="État">
        <ErrorText>{error}</ErrorText>
        {status && (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {status.state === "none" && <Badge>Aucune maintenance</Badge>}
            {status.state === "scheduled" && (
              <>
                <Badge tone="warm">Programmée</Badge>
                <span>
                  du {dateTime(status.startsAt)} au {dateTime(status.endsAt)}{" "}
                  (annoncée dans l'extension et sur le site)
                </span>
              </>
            )}
            {status.state === "ongoing" && (
              <>
                <Badge tone="danger">En cours</Badge>
                <span>
                  depuis le {dateTime(status.startsAt)}, fin estimée{" "}
                  {dateTime(status.endsAt)}
                </span>
              </>
            )}
            {status.state !== "none" && (
              <Button kind="primary" onClick={() => void reopen()}>
                Rouvrir maintenant
              </Button>
            )}
          </div>
        )}
      </Card>
      <Card
        title={
          status?.state === "none"
            ? "Programmer une maintenance"
            : "Modifier la maintenance"
        }
      >
        <form className="flex flex-col gap-3" onSubmit={submit}>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Début (heure locale)">
              <input
                type="datetime-local"
                className={inputClass}
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
              />
            </Field>
            <Field label="Durée estimée (minutes)">
              <input
                className={inputClass}
                inputMode="numeric"
                value={duration}
                onChange={(event) =>
                  setDuration(event.target.value.replace(/\D/g, ""))
                }
              />
            </Field>
            <Field label="Message en français">
              <textarea
                className={inputClass}
                rows={2}
                value={messageFr}
                onChange={(event) => setMessageFr(event.target.value)}
              />
            </Field>
            <Field label="Message en anglais">
              <textarea
                className={inputClass}
                rows={2}
                value={messageEn}
                onChange={(event) => setMessageEn(event.target.value)}
              />
            </Field>
          </div>
          <Field label="Comptes qui gardent l'accès (adresses e-mail, une par ligne)">
            <textarea
              className={`${inputClass} font-mono`}
              rows={3}
              value={exceptions}
              onChange={(event) => setExceptions(event.target.value)}
            />
          </Field>
          <p className="text-sm text-muted">
            Dès l'enregistrement, les machines connectées affichent l'annonce. À
            l'heure prévue, les autres comptes perdent l'accès et voient le
            message ; les données restent intactes.
          </p>
          <ErrorText>{failure}</ErrorText>
          <div>
            <Button kind="primary" type="submit" disabled={busy || !duration}>
              {status?.state === "none" ? "Programmer" : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
