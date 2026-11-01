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
        {subtitle && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </p>
        )}
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
        "rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/70 dark:bg-zinc-900 dark:ring-zinc-800",
        className,
      )}
    >
      {(title || actions) && (
        <div className="flex flex-col justify-between gap-3 border-b border-zinc-100 px-5 py-4 sm:flex-row sm:items-center dark:border-zinc-800">
          <div>
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {description && (
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                {description}
              </p>
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
  accent: {
    icon: "text-[#1860a0] dark:text-[#5896d8]",
    bg: "bg-[#1860a0]/10 dark:bg-[#5896d8]/15",
  },
  warm: {
    icon: "text-[#de791a] dark:text-[#faa03a]",
    bg: "bg-[#f29430]/12 dark:bg-[#faa03a]/15",
  },
  danger: { icon: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" },
  success: {
    icon: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  violet: {
    icon: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
  },
  slate: { icon: "text-zinc-600 dark:text-zinc-300", bg: "bg-zinc-500/10" },
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
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        <p className="text-3xl font-bold tabular-nums tracking-tight">
          {value}
        </p>
        {hint && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">{hint}</p>
        )}
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
    "rounded-xl bg-white p-5 text-left shadow-sm ring-1 ring-zinc-200/70 dark:bg-zinc-900 dark:ring-zinc-800";
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
          <tr className="bg-zinc-50 dark:bg-zinc-800/50">
            {head.map((label, index) => (
              <th
                // biome-ignore lint/suspicious/noArrayIndexKey: les en-têtes sont fixes et peuvent être vides.
                key={index}
                className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {children}
        </tbody>
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
        "transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40",
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
    primary: "bg-[#1860a0] text-white shadow-sm hover:bg-[#14528a]",
    outline:
      "border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800",
    ghost:
      "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
    danger:
      "border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/50",
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
      <span className="font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none transition-shadow focus:border-[#1860a0] focus:ring-2 focus:ring-[#1860a0]/20 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 [textarea&]:h-auto [textarea&]:py-2";

export function ErrorText({ children }: { children: ReactNode }) {
  return children ? (
    <p className="text-sm text-red-600 dark:text-red-400">{children}</p>
  ) : null;
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
  const color = {
    accent: "bg-[#1860a0] dark:bg-[#5896d8]",
    warm: "bg-[#f29430]",
    danger: "bg-red-500",
  };
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
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
          className="h-28 animate-pulse rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60"
        />
      ))}
    </div>
  );
}
