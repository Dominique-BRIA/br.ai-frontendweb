"use client";

import type { ReactNode } from "react";

/** Petits éléments communs du tableau de bord. */

export function Card({
  title,
  children,
  actions,
}: {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-md border border-border bg-card p-4">
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && (
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              {title}
            </h2>
          )}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: ReactNode;
  tone?: "warm" | "danger";
}) {
  const color =
    tone === "danger"
      ? "text-danger"
      : tone === "warm"
        ? "text-warm"
        : "text-foreground";
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${color}`}>{value}</div>
    </div>
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
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {head.map((label) => (
              <th
                key={label}
                className="border-b border-border px-2 py-2 text-left font-medium text-muted"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Cell({
  children,
  mono,
}: {
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <td
      className={`border-b border-border px-2 py-2 align-top ${mono ? "font-mono" : ""}`}
    >
      {children}
    </td>
  );
}

export function Button({
  children,
  onClick,
  kind = "secondary",
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: "primary" | "secondary" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const styles = {
    primary: "bg-accent text-white hover:opacity-90",
    secondary: "border border-border hover:border-accent",
    danger: "border border-danger text-danger hover:bg-danger hover:text-white",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${styles[kind]}`}
    >
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
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-accent";

export function ErrorText({ children }: { children: ReactNode }) {
  return children ? <p className="text-sm text-danger">{children}</p> : null;
}

export function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: "accent" | "warm" | "danger" | "muted";
}) {
  const styles = {
    accent: "border-accent text-accent",
    warm: "border-warm text-warm",
    danger: "border-danger text-danger",
    muted: "border-border text-muted",
  };
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${styles[tone ?? "muted"]}`}
    >
      {children}
    </span>
  );
}
