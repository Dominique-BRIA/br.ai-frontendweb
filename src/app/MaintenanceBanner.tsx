"use client";

import { useEffect, useState } from "react";
import { type Lang, TEXTS } from "./i18n";

interface Status {
  state: "none" | "scheduled" | "ongoing";
  startsAt: string | null;
  endsAt: string | null;
  message: { fr: string; en: string };
}

const when = (iso: string | null, locale: string) =>
  iso
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: "full",
        timeStyle: "short",
      }).format(new Date(iso))
    : "";

/** Bandeau du site : maintenance annoncée ou en cours. */
export function MaintenanceBanner({ lang }: { lang: Lang }) {
  const t = TEXTS[lang].maintenance;
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
          <strong>{t.ongoing}</strong>{" "}
          {status.message[lang] || status.message.fr}
          {status.endsAt && ` ${t.back} ${when(status.endsAt, t.locale)}.`}
        </>
      ) : (
        <>
          <strong>
            {t.planned} {when(status.startsAt, t.locale)}.
          </strong>{" "}
          {status.message[lang] || status.message.fr}
        </>
      )}
    </output>
  );
}
