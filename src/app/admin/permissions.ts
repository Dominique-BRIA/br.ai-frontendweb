/**
 * Autorisations des comptes de l'équipe interne, une par section du tableau de bord (le
 * serveur a la même liste, dans auth/adminPermissions.ts). « retours » donne la section
 * entière, « retours:lecture » la seule consultation. La vue d'ensemble et le profil sont
 * ouverts à tous.
 */
export const PERMISSIONS = [
  { id: "utilisateurs", label: "Utilisateurs" },
  { id: "equipes", label: "Équipes" },
  { id: "couts", label: "Coûts d'IA" },
  { id: "codes", label: "Codes promo" },
  { id: "demandes", label: "Demandes de bêta" },
  { id: "retours", label: "Retours" },
  { id: "maintenance", label: "Maintenance" },
  { id: "comptes", label: "Équipe interne" },
  { id: "reglages", label: "Réglages" },
] as const;

export type Permission = (typeof PERMISSIONS)[number]["id"];

export type Level = "none" | "read" | "full";

export const LEVELS: { id: Level; label: string }[] = [
  { id: "none", label: "Aucun" },
  { id: "read", label: "Lecture" },
  { id: "full", label: "Complet" },
];

export function levelOf(grants: readonly string[], id: string): Level {
  if (grants.includes(id)) return "full";
  return grants.includes(`${id}:lecture`) ? "read" : "none";
}

export function withLevel(
  grants: readonly string[],
  id: Permission,
  level: Level,
): string[] {
  const others = grants.filter(
    (grant) => grant !== id && grant !== `${id}:lecture`,
  );
  if (level === "none") return others;
  return [...others, level === "full" ? id : `${id}:lecture`];
}

/** Toutes les sections au même niveau. */
export const allAt = (level: Level): string[] =>
  level === "none"
    ? []
    : PERMISSIONS.map((permission) =>
        level === "full" ? permission.id : `${permission.id}:lecture`,
      );

export const isFull = (grants: readonly string[]) =>
  PERMISSIONS.every((permission) => grants.includes(permission.id));

/** Le compte connecté, tel que le renvoie /api/admin/session. */
export interface Me {
  id: string;
  email: string;
  name: string;
  permissions: string[];
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
