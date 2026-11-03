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
    alreadyInvited: "Le même compte fonctionne sur le web et dans VS Code.",
    videoLabel: "L'emblème de Retour à la ligne en rotation",
    signIn: {
      emailTitle: "Commencer",
      emailIntro:
        "Inscription ou connexion : un code arrive par e-mail, sans mot de passe.",
      emailLabel: "Adresse e-mail",
      emailPlaceholder: "Saisissez votre e-mail",
      getCode: "Recevoir un code",
      nameTitle: "Votre nom",
      nameIntro: "Le nom que votre équipe verra dans le chat.",
      nameLabel: "Nom affiché",
      continue: "Continuer",
      codeTitle: "Vérifiez vos e-mails",
      codeIntro: "Saisissez le code à 6 chiffres envoyé à {0}.",
      codeLabel: "Code de connexion",
      signIn: "Se connecter",
      sending: "Un instant…",
      changeEmail: "Changer d'adresse",
      resend: "Renvoyer le code",
      codeResent: "Un nouveau code vient de partir.",
      askCredits: "Recevoir un code de crédits d'IA",
      errors: {
        failed: "La connexion n'a pas abouti. Réessayez.",
        network: "Le serveur <br/> ne répond pas. Réessayez dans un instant.",
        invalid_email: "Saisissez une adresse e-mail valable.",
        invalid_request: "Saisissez une adresse e-mail valable.",
        code_invalid: "Code incorrect.",
        code_expired: "Ce code a expiré. Demandez-en un nouveau.",
        too_many_attempts: "Trop d'essais. Demandez un nouveau code.",
        too_many_requests:
          "Un code vient de partir : utilisez-le, ou attendez une minute avant d'en demander un autre.",
        signup_limited:
          "Trop de comptes créés depuis cette connexion. Réessayez dans une heure.",
        account_suspended:
          "Ce compte est suspendu. Contactez l'équipe de <br/>.",
        display_name_required: "Indiquez le nom à afficher.",
        mail_failed: "L'e-mail n'a pas pu partir. Réessayez dans un instant.",
        maintenance: "<br/> est en maintenance. Réessayez un peu plus tard.",
      },
    },
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
    alreadyInvited: "The same account works on the web and in VS Code.",
    videoLabel: "The Retour à la ligne emblem, rotating",
    signIn: {
      emailTitle: "Get started",
      emailIntro:
        "Sign up or sign in: a code arrives by email, no password needed.",
      emailLabel: "Email address",
      emailPlaceholder: "Enter your email",
      getCode: "Get a code",
      nameTitle: "Your name",
      nameIntro: "The name your team will see in the chat.",
      nameLabel: "Display name",
      continue: "Continue",
      codeTitle: "Check your email",
      codeIntro: "Enter the 6-digit code sent to {0}.",
      codeLabel: "Sign-in code",
      signIn: "Sign in",
      sending: "One moment…",
      changeEmail: "Use another address",
      resend: "Resend the code",
      codeResent: "A new code is on its way.",
      askCredits: "Get an AI credits code",
      errors: {
        failed: "Sign-in did not go through. Please try again.",
        network:
          "The <br/> server is not responding. Please try again in a moment.",
        invalid_email: "Enter a valid email address.",
        invalid_request: "Enter a valid email address.",
        code_invalid: "Incorrect code.",
        code_expired: "This code has expired. Ask for a new one.",
        too_many_attempts: "Too many attempts. Ask for a new code.",
        too_many_requests:
          "A code was just sent: use it, or wait a minute before asking for another.",
        signup_limited:
          "Too many accounts created from this connection. Please try again in an hour.",
        account_suspended: "This account is suspended. Contact the <br/> team.",
        display_name_required: "Enter the name to display.",
        mail_failed:
          "The email could not be sent. Please try again in a moment.",
        maintenance:
          "<br/> is under maintenance. Please try again a little later.",
      },
    },
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
