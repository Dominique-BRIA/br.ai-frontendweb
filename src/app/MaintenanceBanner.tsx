"use client";

import { useEffect, useState } from "react";

interface Status {
  state: "none" | "scheduled" | "ongoing";
  startsAt: string | null;
  endsAt: string | null;
  message: { fr: string; en: string };
}

const when = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "full",
        timeStyle: "short",
      }).format(new Date(iso))
    : "";

/** Bandeau du site : maintenance annoncée ou en cours. */
export function MaintenanceBanner() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((response) => response.json())
      .then((json: { maintenance: Status | null }) =>
        setStatus(json.maintenance),
      )
      .catch(() => setStatus(null));
  }, []);

  if (!status || status.state === "none") return null;
  return (
    <output className="block border-b border-warm bg-warm/15 px-4 py-2 text-center text-sm">
      {status.state === "ongoing" ? (
        <>
          <strong>Maintenance en cours.</strong> {status.message.fr}
          {status.endsAt && ` Retour prévu vers ${when(status.endsAt)}.`}
        </>
      ) : (
        <>
          <strong>Maintenance prévue le {when(status.startsAt)}.</strong>{" "}
          {status.message.fr}
        </>
      )}
    </output>
  );
}
