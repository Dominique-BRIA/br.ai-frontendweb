/**
 * L'éditeur du site et du service, tel qu'il apparaît dans les mentions légales et la politique
 * de confidentialité. Un champ laissé à null n'est pas affiché : à compléter avant l'ouverture
 * commerciale (statut juridique, numéro d'immatriculation, adresse, adresse e-mail de contact).
 */
export const PUBLISHER = {
  name: "Dominique Bria",
  /** Exemple : « Entrepreneur individuel », ou la forme de la société. */
  status: null as string | null,
  /** Numéro d'immatriculation (RCCM, SIREN…), s'il existe. */
  registration: null as string | null,
  address: null as string | null,
  email: null as string | null,
  /** Droit applicable et tribunaux compétents, à préciser avec l'immatriculation. */
  jurisdiction: null as string | null,
};

/** Date de la dernière mise à jour des pages légales. */
export const LEGAL_UPDATED = { fr: "2 novembre 2026", en: "2 November 2026" };
