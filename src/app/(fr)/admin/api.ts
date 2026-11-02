"use client";

import { useCallback, useEffect, useState } from "react";

/** Le cookie d'administration a expiré ou n'existe pas : il faut se reconnecter. */
export class SignedOut extends Error {}

/** Appelle une route /admin du serveur <br/>, à travers le relais du site. */
export async function api<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`/api/admin/${path}`, {
    method: init.method ?? "GET",
    headers:
      init.body === undefined
        ? undefined
        : { "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (response.status === 401) throw new SignedOut();
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      json?.error?.message ?? json?.error ?? `Erreur ${response.status}`;
    throw new Error(String(message));
  }
  return json as T;
}

/** Charge une route au montage, et sur demande. */
export function useAdminData<T>(path: string, onSignedOut: () => void) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setData(await api<T>(path));
      setError(null);
    } catch (cause) {
      if (cause instanceof SignedOut) onSignedOut();
      else setError((cause as Error).message);
    }
  }, [path, onSignedOut]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, reload };
}

export const number = (value: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);
export const dateTime = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(iso))
    : "—";
export const date = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
        new Date(iso),
      )
    : "—";
