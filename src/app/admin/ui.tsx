"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Éléments du tableau de bord : fond gris clair, cartes blanches arrondies avec une ombre
 * légère (et leur équivalent sombre), bleu du logo pour les actions et l'élément actif.
 */

const cx = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

/** En-tête d'une page : titre, sous-titre et actions. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  description,
  children,
  actions,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "rounded-xl bg-card shadow-sm ring-1 ring-border",
        className,
      )}
    >
      {(title || actions) && (
        <div className="flex flex-col justify-between gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center">
          <div>
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {description && (
              <p className="mt-0.5 text-sm text-muted">{description}</p>
            )}
          </div>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

const TONES = {
  accent: { icon: "text-accent", bg: "bg-accent-soft" },
  warm: { icon: "text-warm", bg: "bg-warm/15" },
  danger: { icon: "text-danger", bg: "bg-danger/10" },
  success: {
    icon: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  violet: {
    icon: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
  },
  slate: { icon: "text-muted", bg: "bg-muted/10" },
} as const;
export type Tone = keyof typeof TONES;

/** Une statistique : grand nombre, libellé, icône dans un carré teinté. */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "accent",
  hint,
  onClick,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: Tone;
  hint?: string;
  onClick?: () => void;
}) {
  const body = (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className="text-3xl font-bold tabular-nums tracking-tight">
          {value}
        </p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      <div
        className={cx(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
          TONES[tone].bg,
        )}
      >
        <Icon className={cx("h-6 w-6", TONES[tone].icon)} aria-hidden="true" />
      </div>
    </div>
  );
  const classes =
    "rounded-xl bg-card p-5 text-left shadow-sm ring-1 ring-border";
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        classes,
        "w-full transition-all hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      {body}
    </button>
  ) : (
    <div className={classes}>{body}</div>
  );
}

export function Table({
  head,
  children,
}: {
  head: string[];
  children: ReactNode;
}) {
  return (
    <div className="-mx-5 -my-5 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-background">
            {head.map((label, index) => (
              <th
                // biome-ignore lint/suspicious/noArrayIndexKey: les en-têtes sont fixes et peuvent être vides.
                key={index}
                className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

export function Row({
  children,
  muted,
}: {
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <tr
      className={cx(
        "transition-colors hover:bg-accent-soft",
        muted && "opacity-50",
      )}
    >
      {children}
    </tr>
  );
}

export function Cell({
  children,
  mono,
  strong,
}: {
  children: ReactNode;
  mono?: boolean;
  strong?: boolean;
}) {
  return (
    <td
      className={cx(
        "px-5 py-3 align-middle",
        mono && "font-mono text-[13px]",
        strong && "font-medium",
      )}
    >
      {children}
    </td>
  );
}

export function Button({
  children,
  onClick,
  kind = "outline",
  type = "button",
  disabled,
  icon: Icon,
  title,
}: {
  children?: ReactNode;
  onClick?: () => void;
  kind?: "primary" | "outline" | "ghost" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
  icon?: LucideIcon;
  title?: string;
}) {
  const styles = {
    primary: "bg-primary text-white shadow-sm hover:brightness-110",
    outline: "border border-border bg-card hover:bg-accent-soft",
    ghost: "text-muted hover:bg-accent-soft",
    danger: "border border-danger/40 text-danger hover:bg-danger/10",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={!children ? title : undefined}
      className={cx(
        "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        styles[kind],
      )}
    >
      {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: le champ est passé en enfant et se trouve donc dans le libellé.
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "h-9 rounded-lg border border-border bg-field px-3 text-sm outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50 [textarea&]:h-auto [textarea&]:py-2";

export function ErrorText({ children }: { children: ReactNode }) {
  return children ? <p className="text-sm text-danger">{children}</p> : null;
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        TONES[tone].bg,
        TONES[tone].icon,
      )}
    >
      {children}
    </span>
  );
}

/** Barre de part (pour les coûts, la consommation). */
export function Meter({
  ratio,
  tone = "accent",
}: {
  ratio: number;
  tone?: Tone;
}) {
  const color = { accent: "bg-accent", warm: "bg-warm", danger: "bg-danger" };
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/60">
      <div
        className={cx(
          "h-full rounded-full",
          color[tone as keyof typeof color] ?? color.accent,
        )}
        style={{ width: `${Math.max(0, Math.min(1, ratio)) * 100}%` }}
      />
    </div>
  );
}

export function Loading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className="h-28 animate-pulse rounded-xl bg-border/50"
        />
      ))}
    </div>
  );
}
