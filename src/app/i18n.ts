/** Les deux langues du site public. Le tableau de bord d'administration reste en français. */
export type Lang = "fr" | "en";

/** Chaque page publique et son adresse dans les deux langues, pour passer de l'une à l'autre. */
export const ROUTES = {
  home: { fr: "/", en: "/en" },
  notice: { fr: "/mentions-legales", en: "/en/legal-notice" },
  privacy: { fr: "/confidentialite", en: "/en/privacy" },
  terms: { fr: "/conditions", en: "/en/terms" },
} as const;

export type PageKey = keyof typeof ROUTES;

export const TEXTS = {
  fr: {
    title: "Retour à la ligne",
    tagline: "Redonner un sens au travail d'équipe",
    pitch:
      "Un chat d'équipe où l'IA note vos décisions, arbitre vos désaccords et écrit le code sur vos machines.",
    install: "Installer l'extension pour VS Code",
    alreadyInvited:
      "L'inscription est libre : ouvrez <br/> dans VS Code pour créer votre compte.",
    videoLabel: "L'emblème de Retour à la ligne en rotation",
    beta: {
      label: "Adresse e-mail",
      placeholder: "Saisissez votre e-mail",
      submit: "Recevoir un code d'invitation",
      sending: "Envoi…",
      note: "Le code donne des crédits d'IA à votre équipe. Votre adresse ne sert qu'à vous l'envoyer.",
      failed: "La demande n'a pas pu être envoyée.",
      receivedTitle: "Demande reçue",
      receivedBefore: "Nous écrirons à ",
      receivedAfter: " avec votre code d'invitation et ses crédits d'IA.",
    },
    theme: {
      dark: "Sombre",
      light: "Clair",
      toDark: "Passer en mode sombre",
      toLight: "Passer en mode clair",
    },
    footer: {
      notice: "Mentions légales",
      privacy: "Confidentialité",
      terms: "Conditions d'utilisation",
      switchLabel: "English",
      switchTitle: "Read this page in English",
    },
    maintenance: {
      ongoing: "Maintenance en cours.",
      back: "Retour prévu vers",
      planned: "Maintenance prévue le",
      locale: "fr-FR",
    },
  },
  en: {
    // Le nom de la marque ne se traduit pas.
    title: "Retour à la ligne",
    tagline: "Giving meaning back to teamwork",
    pitch:
      "A team chat where AI keeps track of your decisions, settles disagreements and writes the code on your machines.",
    install: "Install the VS Code extension",
    alreadyInvited: "Sign-up is open: open <br/> in VS Code to create your account.",
    videoLabel: "The Retour à la ligne emblem, rotating",
    beta: {
      label: "Email address",
      placeholder: "Enter your email",
      submit: "Get an invitation code",
      sending: "Sending…",
      note: "The code gives your team AI credits. Your address is only used to send it to you.",
      failed: "Your request could not be sent.",
      receivedTitle: "Request received",
      receivedBefore: "We'll write to ",
      receivedAfter: " with your invitation code and its AI credits.",
    },
    theme: {
      dark: "Dark",
      light: "Light",
      toDark: "Switch to dark mode",
      toLight: "Switch to light mode",
    },
    footer: {
      notice: "Legal notice",
      privacy: "Privacy",
      terms: "Terms of use",
      switchLabel: "Français",
      switchTitle: "Lire cette page en français",
    },
    maintenance: {
      ongoing: "Maintenance in progress.",
      back: "Expected back around",
      planned: "Maintenance scheduled for",
      locale: "en-GB",
    },
  },
} as const;
