/**
 * Autorisations des comptes de l'équipe interne, une par section du tableau de bord (le
 * serveur a la même liste, dans auth/adminPermissions.ts). La vue d'ensemble et le profil
 * sont ouverts à tous.
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
