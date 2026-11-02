"use client";

import { ArrowRight, CircleCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import { type Lang, TEXTS } from "./i18n";

/** La carte de la page d'accueil : laisser son adresse pour recevoir une invitation à la bêta. */
export function BetaRequest({ lang }: { lang: Lang }) {
  const t = TEXTS[lang].beta;
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const address = email.trim();
    const response = await fetch("/api/beta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: address, lang }),
    }).catch(() => null);
    setBusy(false);
    if (response?.ok) {
      setSent(address);
      return;
    }
    const json = await response?.json().catch(() => ({}));
    setError(json?.error ?? t.failed);
  };

  return (
    <div className="w-full max-w-md rounded-3xl bg-card/80 p-8 shadow-lg shadow-black/5 ring-1 ring-border backdrop-blur">
      {sent ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CircleCheck className="h-10 w-10 text-accent" aria-hidden="true" />
          <p className="text-lg font-semibold">{t.receivedTitle}</p>
          <p className="text-muted">
            {t.receivedBefore}
            <span className="text-foreground">{sent}</span>
            {t.receivedAfter}
          </p>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <label htmlFor="beta-email" className="sr-only">
            {t.label}
          </label>
          <input
            id="beta-email"
            type="email"
            required
            autoComplete="email"
            placeholder={t.placeholder}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 rounded-xl border border-border bg-field px-4 text-base outline-none transition-shadow placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-foreground font-semibold text-background transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? t.sending : t.submit}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          {error && (
            <p role="alert" className="text-center text-sm text-danger">
              {error}
            </p>
          )}
          <p className="text-center text-sm text-muted">{t.note}</p>
        </form>
      )}
    </div>
  );
}
