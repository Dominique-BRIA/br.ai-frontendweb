import type { Lang } from "../i18n";
import type { LegalDocument } from "./LegalPage";
import { PUBLISHER } from "./publisher";

/** Conditions d'utilisation du service pendant la bêta privée. */
export const TERMS: Record<Lang, LegalDocument> = {
  fr: {
    title: "Conditions d'utilisation",
    intro:
      "Ces conditions encadrent l'utilisation de <br/> (Retour à la ligne) : le site, le serveur et l'extension pour Visual Studio Code. En créant un compte, vous les acceptez.",
    sections: [
      {
        title: "Le service",
        blocks: [
          "<br/> est un chat d'équipe autour d'un projet. Un agent, le serveur, suit la conversation, tient la mémoire du projet et aide l'équipe à décider ; un second agent, le cuisinier, réalise les commandes (code, documents) sur la machine d'un membre.",
        ],
      },
      {
        title: "Bêta privée",
        blocks: [
          "Le service est en bêta privée, accessible sur invitation et gratuit pendant cette période. Il peut évoluer, être interrompu pour maintenance ou présenter des erreurs. Les fonctions, les quotas et les formules peuvent changer avant l'ouverture commerciale ; nous vous prévenons de tout changement important.",
        ],
      },
      {
        title: "Votre compte",
        blocks: [
          {
            list: [
              "Un compte correspond à une personne. Vous vous connectez par un code envoyé à votre adresse e-mail : ne le partagez pas.",
              "Vous êtes responsable de ce qui est fait depuis votre compte et vos machines connectées.",
              "Dans une équipe, le chef d'équipe gère les membres, les projets et peut arrêter une commande ; chaque membre peut passer commande au serveur.",
            ],
          },
        ],
      },
      {
        title: "Le cuisinier sur votre machine",
        blocks: [
          "Quand vous prêtez votre machine, le cuisinier peut y lire et écrire des fichiers et y lancer des commandes, dans le dossier du projet et selon le mode de permission que vous choisissez. Vous restez maître de ce mode et de ce qui est conservé.",
          "Gardez vos projets sous contrôle de version et relisez les changements avant de les publier : le cuisinier peut se tromper, et <br/> ne peut être tenu responsable d'une perte de données sur une machine prêtée.",
        ],
      },
      {
        title: "Les réponses de l'IA",
        blocks: [
          "Les réponses, synthèses, arbitrages et livrables produits par l'IA peuvent être inexacts ou incomplets. Ils ne remplacent pas votre jugement : vérifiez-les avant de vous y fier, en particulier pour du code mis en production ou des décisions importantes.",
        ],
      },
      {
        title: "Utilisation acceptable",
        blocks: [
          "Vous vous engagez à ne pas :",
          {
            list: [
              "publier ou faire produire des contenus illicites, haineux, ou qui portent atteinte aux droits d'autrui ;",
              "utiliser le service pour attaquer, espionner ou endommager des systèmes, y compris par le cuisinier ;",
              "contourner les quotas, les limites ou les mesures de sécurité, ni revendre l'accès au service ;",
              "envoyer des informations sensibles (santé, données bancaires, secrets d'autrui) dans le chat pendant la bêta.",
            ],
          },
        ],
      },
      {
        title: "Vos contenus",
        blocks: [
          "Vous restez propriétaire de vos messages, fichiers et livrables. Vous nous autorisez seulement à les héberger, les traiter et les transmettre aux fournisseurs d'IA dans la mesure nécessaire au fonctionnement du service, comme décrit dans la politique de confidentialité.",
        ],
      },
      {
        title: "Suspension et fin",
        blocks: [
          "Nous pouvons suspendre un compte qui ne respecte pas ces conditions, après vous en avoir informé sauf urgence. Vous pouvez supprimer votre compte à tout moment depuis l'extension (Réglages, « Supprimer mon compte »).",
        ],
      },
      {
        title: "Responsabilité",
        blocks: [
          "Pendant la bêta, le service est fourni en l'état, sans garantie de disponibilité ni d'adéquation à un usage particulier. Dans les limites permises par la loi, notre responsabilité ne saurait être engagée pour un dommage indirect, une perte de données ou un manque à gagner liés à son utilisation.",
        ],
      },
      {
        title: "Modifications et droit applicable",
        blocks: [
          "Ces conditions peuvent évoluer ; la date de mise à jour figure en haut de la page et nous vous prévenons de tout changement important.",
          PUBLISHER.jurisdiction ??
            "Le droit applicable et la juridiction compétente seront précisés à l'ouverture commerciale du service.",
        ],
      },
    ],
  },
  en: {
    title: "Terms of use",
    intro:
      "These terms govern the use of <br/> (Retour à la ligne): the website, the server and the Visual Studio Code extension. By creating an account, you accept them.",
    sections: [
      {
        title: "The service",
        blocks: [
          "<br/> is a team chat built around a project. One agent, the server, follows the conversation, keeps the project memory and helps the team decide; a second agent, the cook, carries out orders (code, documents) on a member's machine.",
        ],
      },
      {
        title: "Private beta",
        blocks: [
          "The service is in private beta, invitation-only and free during this period. It may change, be interrupted for maintenance or contain errors. Features, quotas and plans may change before the commercial launch; we will let you know about any significant change.",
        ],
      },
      {
        title: "Your account",
        blocks: [
          {
            list: [
              "An account belongs to one person. You sign in with a code sent to your email address: do not share it.",
              "You are responsible for what is done from your account and your connected machines.",
              "In a team, the team lead manages members and projects and can stop an order; every member can give orders to the server.",
            ],
          },
        ],
      },
      {
        title: "The cook on your machine",
        blocks: [
          "When you lend your machine, the cook can read and write files and run commands on it, inside the project folder and according to the permission mode you choose. You stay in control of that mode and of what is kept.",
          "Keep your projects under version control and review changes before publishing them: the cook can make mistakes, and <br/> cannot be held responsible for data loss on a lent machine.",
        ],
      },
      {
        title: "AI answers",
        blocks: [
          "The answers, summaries, decisions and deliverables produced by the AI may be inaccurate or incomplete. They do not replace your judgement: check them before relying on them, especially for code going to production or for important decisions.",
        ],
      },
      {
        title: "Acceptable use",
        blocks: [
          "You agree not to:",
          {
            list: [
              "publish or have the service produce content that is illegal, hateful or infringes the rights of others;",
              "use the service to attack, spy on or damage systems, including through the cook;",
              "circumvent quotas, limits or security measures, or resell access to the service;",
              "send sensitive information (health, banking details, other people's secrets) in the chat during the beta.",
            ],
          },
        ],
      },
      {
        title: "Your content",
        blocks: [
          "You remain the owner of your messages, files and deliverables. You only allow us to host and process them, and to send them to AI providers, to the extent needed to run the service, as described in the privacy policy.",
        ],
      },
      {
        title: "Suspension and termination",
        blocks: [
          "We may suspend an account that breaches these terms, after informing you except in an emergency. You can delete your account at any time from the extension (Settings, “Delete my account”).",
        ],
      },
      {
        title: "Liability",
        blocks: [
          "During the beta, the service is provided as is, with no guarantee of availability or fitness for a particular purpose. To the extent permitted by law, we shall not be liable for indirect damage, data loss or loss of profit arising from its use.",
        ],
      },
      {
        title: "Changes and governing law",
        blocks: [
          "These terms may change; the update date appears at the top of the page and we will let you know about any significant change.",
          PUBLISHER.jurisdiction ??
            "The governing law and competent courts will be specified when the service opens commercially.",
        ],
      },
    ],
  },
};
