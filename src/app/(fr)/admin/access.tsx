"use client";

import {
  allAt,
  isFull,
  LEVELS,
  levelOf,
  PERMISSIONS,
  withLevel,
} from "./permissions";
import { Badge } from "./ui";

/** Le niveau d'accès de chaque section : à la création d'un compte et pour le modifier. */
export function AccessPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3 text-xs">
        <button
          type="button"
          className="font-medium text-accent hover:underline"
          onClick={() => onChange(allAt("full"))}
        >
          Tout en complet
        </button>
        <button
          type="button"
          className="font-medium text-accent hover:underline"
          onClick={() => onChange(allAt("read"))}
        >
          Tout en lecture
        </button>
        <button
          type="button"
          className="font-medium text-muted hover:underline"
          onClick={() => onChange([])}
        >
          Tout retirer
        </button>
      </div>
      <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {PERMISSIONS.map((permission) => {
          const current = levelOf(value, permission.id);
          return (
            <div
              key={permission.id}
              className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
            >
              <span>{permission.label}</span>
              <fieldset className="flex shrink-0 rounded-md bg-background p-0.5 ring-1 ring-border">
                <legend className="sr-only">{permission.label}</legend>
                {LEVELS.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    aria-pressed={current === level.id}
                    onClick={() =>
                      onChange(withLevel(value, permission.id, level.id))
                    }
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                      current === level.id
                        ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </fieldset>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted">
        Lecture : la section se consulte sans pouvoir rien y changer. La vue
        d'ensemble et le profil restent ouverts à tous les comptes.
      </p>
    </div>
  );
}

/** Les accès d'un compte, en badges. */
export function AccessBadges({ grants }: { grants: string[] }) {
  if (isFull(grants))
    return <Badge tone="accent">Tout le tableau de bord</Badge>;
  const granted = PERMISSIONS.filter(
    (permission) => levelOf(grants, permission.id) !== "none",
  );
  if (granted.length === 0)
    return <span className="text-sm text-muted">Vue d'ensemble seule</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {granted.map((permission) =>
        levelOf(grants, permission.id) === "full" ? (
          <Badge key={permission.id} tone="accent">
            {permission.label}
          </Badge>
        ) : (
          <Badge key={permission.id}>{permission.label} · lecture</Badge>
        ),
      )}
    </div>
  );
}
