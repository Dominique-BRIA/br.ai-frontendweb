"use client";

import { ArrowLeft, ArrowRight, Gift } from "lucide-react";
import { type FormEvent, useState } from "react";
import { BetaRequest } from "./BetaRequest";
import { type Lang, TEXTS } from "./i18n";

type Step = "email" | "name" | "code";

const fieldClass =
  "h-12 rounded-xl border border-border bg-field px-4 text-base outline-none transition-shadow placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20";
const buttonClass =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-foreground font-semibold text-background transition hover:opacity-90 disabled:opacity-50";

/**
 * Inscription et connexion sur la page d'accueil, comme dans l'extension : l'adresse, le nom si
 * le compte est nouveau, puis le code reçu par e-mail. La plateforme s'ouvre ensuite.
 */
export function SignInCard({ lang }: { lang: Lang }) {
  const t = TEXTS[lang].signIn;
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [code, setCode] = useState("");
  const [newAccount, setNewAccount] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [askCredits, setAskCredits] = useState(false);

  const explain = (failure: string | undefined) =>
    (failure && t.errors[failure as keyof typeof t.errors]) || t.errors.failed;

  const post = async (path: string, body: object) => {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    const json = (await response?.json().catch(() => ({}))) ?? {};
    return {
      ok: response?.ok ?? false,
      json,
      failure: response ? json.code : "network",
    };
  };

  const requestCode = async (again = false) => {
    setBusy(true);
    setError(null);
    const { ok, json, failure } = await post("/api/auth/code", {
      email: email.trim(),
    });
    setBusy(false);
    if (ok) {
      setNewAccount(json.newAccount);
      setNotice(again ? t.codeResent : null);
      setStep(json.newAccount && !again ? "name" : "code");
      return;
    }
    if (failure === "too_many_requests") {
      // Un code est déjà parti : il reste valable.
      setNotice(t.errors.too_many_requests);
      setStep((current) => (current === "email" ? "code" : current));
      return;
    }
    setError(explain(failure));
  };

  const verify = async () => {
    setBusy(true);
    setError(null);
    const { ok, failure } = await post("/api/auth/verify", {
      email: email.trim(),
      code: code.trim(),
      displayName: newAccount ? displayName.trim() : undefined,
    });
    if (ok) {
      window.location.assign("/app");
      return;
    }
    setBusy(false);
    if (failure === "display_name_required") setStep("name");
    setError(explain(failure));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (step === "email") {
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
        setError(t.errors.invalid_email);
        return;
      }
      void requestCode();
    } else if (step === "name") {
      if (!displayName.trim()) return;
      setError(null);
      setStep("code");
    } else if (/^\d{6}$/.test(code.trim())) {
      void verify();
    }
  };

  const restart = () => {
    setStep("email");
    setCode("");
    setError(null);
    setNotice(null);
  };

  const titles: Record<Step, [string, string]> = {
    email: [t.emailTitle, t.emailIntro],
    name: [t.nameTitle, t.nameIntro],
    code: [t.codeTitle, t.codeIntro.replace("{0}", email.trim())],
  };
  const [title, intro] = titles[step];

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <form
        className="flex w-full flex-col gap-4 rounded-3xl bg-card/80 p-8 text-left shadow-lg shadow-black/5 ring-1 ring-border backdrop-blur"
        onSubmit={submit}
        noValidate
      >
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted">{intro}</p>
        </div>

        {step === "email" && (
          <label className="flex flex-col gap-2">
            <span className="sr-only">{t.emailLabel}</span>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClass}
            />
          </label>
        )}
        {step === "name" && (
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold">{t.nameLabel}</span>
            <input
              autoComplete="name"
              maxLength={60}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className={fieldClass}
            />
          </label>
        )}
        {step === "code" && (
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold">{t.codeLabel}</span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, ""))
              }
              className={`${fieldClass} text-center font-mono text-2xl tracking-[0.5em]`}
            />
          </label>
        )}

        <button type="submit" disabled={busy} className={buttonClass}>
          {busy
            ? t.sending
            : step === "email"
              ? t.getCode
              : step === "name"
                ? t.continue
                : t.signIn}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>

        {error && (
          <p role="alert" className="text-center text-sm text-danger">
            {error}
          </p>
        )}
        {notice && !error && (
          <output className="block text-center text-sm text-muted">
            {notice}
          </output>
        )}

        {step !== "email" && (
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-1 text-muted hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t.changeEmail}
            </button>
            {step === "code" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void requestCode(true)}
                className="text-accent hover:underline"
              >
                {t.resend}
              </button>
            )}
          </div>
        )}
      </form>

      {askCredits ? (
        <BetaRequest lang={lang} />
      ) : (
        <button
          type="button"
          onClick={() => setAskCredits(true)}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
        >
          <Gift className="h-4 w-4 text-accent" aria-hidden="true" />
          {t.askCredits}
        </button>
      )}
    </div>
  );
}
