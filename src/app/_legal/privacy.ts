import type { Lang } from "../i18n";
import type { LegalDocument } from "./LegalPage";
import { PUBLISHER } from "./publisher";

/** Politique de confidentialité : ce que <br/> collecte, pourquoi, où, combien de temps. */
export const PRIVACY: Record<Lang, LegalDocument> = {
  fr: {
    title: "Politique de confidentialité",
    intro:
      "Cette page explique quelles données <br/> collecte, à quoi elles servent, où elles sont traitées et comment exercer vos droits. Elle s'applique au site br.garah.me, au serveur et à l'extension pour Visual Studio Code.",
    sections: [
      {
        title: "Responsable du traitement",
        blocks: [
          `Le responsable du traitement est ${PUBLISHER.name}, éditeur de <br/>${PUBLISHER.address ? `, ${PUBLISHER.address}` : ""}.`,
          PUBLISHER.email
            ? `Contact pour vos données : ${PUBLISHER.email}.`
            : "Pendant la bêta, contactez-nous par la commande « Envoyer un retour » de l'extension.",
        ],
      },
      {
        title: "Les données que nous traitons",
        blocks: [
          {
            list: [
              "Votre compte : adresse e-mail, nom affiché, langue, date de création.",
              "Vos équipes et projets : nom, membres, rôles (chef d'équipe ou collaborateur), invitations.",
              "Le contenu de vos projets : messages du chat, pièces jointes, mémoire du projet (décisions, tâches, notes), commandes passées au cuisinier, leurs étapes, leur bilan et le nom des fichiers modifiés.",
              "Vos préférences de travail : la copie de sauvegarde de votre mémoire locale (fichier ~/.bria/memoire.md), gardée sur le serveur uniquement pour la restaurer sur une nouvelle machine.",
              "Les secrets du coffre de projet : chiffrés sur le serveur (AES-256-GCM). Leur valeur n'est jamais transmise à l'IA.",
              "Vos machines : un identifiant de machine, le système et l'éditeur utilisés, et les sessions de connexion, dont seule une empreinte est conservée.",
              "L'usage de l'IA : pour chaque appel, le fournisseur, le modèle, le nombre de mots traités (tokens), la durée et les crédits consommés. Le contenu des échanges n'est pas recopié dans ce journal.",
              "Vos retours envoyés depuis l'extension, et votre adresse e-mail si vous demandez un code d'invitation.",
            ],
          },
          "Le site n'utilise ni publicité, ni outil de mesure d'audience, ni cookie de suivi.",
        ],
      },
      {
        title: "À quoi servent ces données",
        blocks: [
          {
            list: [
              "Faire fonctionner le service : comptes, chat d'équipe, mémoire du projet, travail du serveur et du cuisinier (base : l'exécution du service que vous utilisez).",
              "Vous connecter par un code envoyé par e-mail, et vous écrire au sujet de votre compte ou de la bêta.",
              "Mesurer la consommation de crédits, appliquer les quotas des formules, et prévenir les abus (base : notre intérêt légitime à garder un service sûr et viable).",
              "Améliorer <br/> à partir des retours que vous nous envoyez.",
            ],
          },
        ],
      },
      {
        title: "L'intelligence artificielle",
        blocks: [
          "Pour répondre et réaliser les commandes, les messages du projet, sa mémoire et, pour le cuisinier, le contenu des fichiers qu'il lit sont envoyés à des fournisseurs d'IA : Google (Gemini), Mistral AI, Groq et Z.ai. Les secrets du coffre en sont exclus : l'IA n'en voit que les noms.",
          "Pendant la bêta, <br/> utilise les offres gratuites de ces fournisseurs. Sur ces offres, certains peuvent conserver et utiliser les contenus transmis pour améliorer leurs services ; c'est notamment le cas de Google pour l'API Gemini gratuite. N'envoyez donc pas d'informations sensibles dans le chat pendant la bêta.",
        ],
      },
      {
        title: "Ce qui se passe sur votre machine",
        blocks: [
          "Le cuisinier travaille sur la machine du membre qui accepte de la prêter, dans le dossier du projet, selon le mode de permission choisi. Les fichiers restent sur cette machine ; seuls les extraits nécessaires à la commande sont transmis à l'IA, comme décrit ci-dessus.",
          "Le site enregistre seulement, dans votre navigateur, votre choix du mode clair ou sombre.",
        ],
      },
      {
        title: "Où sont traitées vos données",
        blocks: [
          {
            list: [
              "Serveur et base de données : en Europe (Microsoft Azure et Neon, Francfort).",
              "Pièces jointes : Backblaze, aux États-Unis.",
              "Site web : Vercel, réseau mondial.",
              "E-mails : Resend, envoyés depuis l'Irlande.",
              "IA : Google et Groq (États-Unis), Mistral AI (France), Z.ai (hors Union européenne).",
            ],
          },
          "Certains de ces prestataires se trouvent hors de l'Union européenne. Nous choisissons des prestataires qui s'engagent contractuellement à protéger les données qu'ils traitent pour nous.",
        ],
      },
      {
        title: "Durée de conservation",
        blocks: [
          {
            list: [
              "Les codes de connexion : 10 minutes.",
              "Le compte et le contenu des projets : tant que le compte existe. Les messages d'un projet restent visibles pour son équipe après le départ d'un membre.",
              "Les sessions de machine : jusqu'à la déconnexion ou la révocation de la machine.",
              "Les demandes de code d'invitation : jusqu'à la fin de la bêta.",
              "Le journal d'usage de l'IA : le temps nécessaire au suivi des coûts et de la facturation.",
            ],
          },
        ],
      },
      {
        title: "Vos droits",
        blocks: [
          "Vous pouvez accéder à vos données, les faire corriger, en demander une copie, vous opposer à un traitement ou demander leur suppression.",
          "Vous pouvez supprimer votre compte vous-même depuis l'extension (Réglages, « Supprimer mon compte »).",
          PUBLISHER.email
            ? `Pour toute autre demande, écrivez à ${PUBLISHER.email}. Nous répondons dans un délai d'un mois.`
            : "Pour toute autre demande, utilisez la commande « Envoyer un retour » de l'extension. Nous répondons dans un délai d'un mois.",
          "Vous pouvez aussi saisir l'autorité de protection des données de votre pays.",
        ],
      },
      {
        title: "Sécurité",
        blocks: [
          "Les échanges sont chiffrés (HTTPS), les secrets du coffre sont chiffrés au repos, les jetons de connexion ne sont conservés que sous forme d'empreinte, et l'accès au tableau de bord interne est limité par compte et par section.",
        ],
      },
      {
        title: "Modifications",
        blocks: [
          "Cette politique peut évoluer, notamment à l'ouverture commerciale du service. La date de mise à jour figure en haut de la page ; en cas de changement important, nous vous prévenons dans l'extension ou par e-mail.",
        ],
      },
    ],
  },
  en: {
    title: "Privacy policy",
    intro:
      "This page explains what data <br/> collects, what it is used for, where it is processed and how to exercise your rights. It applies to the br.garah.me website, the server and the Visual Studio Code extension.",
    sections: [
      {
        title: "Data controller",
        blocks: [
          `The data controller is ${PUBLISHER.name}, publisher of <br/>${PUBLISHER.address ? `, ${PUBLISHER.address}` : ""}.`,
          PUBLISHER.email
            ? `Contact about your data: ${PUBLISHER.email}.`
            : "During the beta, contact us with the “Send feedback” command in the extension.",
        ],
      },
      {
        title: "The data we process",
        blocks: [
          {
            list: [
              "Your account: email address, display name, language, creation date.",
              "Your teams and projects: name, members, roles (team lead or collaborator), invitations.",
              "Your project content: chat messages, attachments, project memory (decisions, tasks, notes), orders given to the cook, their steps, their summary and the names of the files changed.",
              "Your working preferences: the backup copy of your local memory (the ~/.bria/memoire.md file), kept on the server only to restore it on a new machine.",
              "Project vault secrets: encrypted on the server (AES-256-GCM). Their values are never sent to the AI.",
              "Your machines: a machine identifier, the operating system and editor used, and sign-in sessions, of which only a fingerprint is kept.",
              "AI usage: for each call, the provider, the model, the number of tokens processed, the duration and the credits used. The content of the exchanges is not copied into this log.",
              "The feedback you send from the extension, and your email address if you request an invitation code.",
            ],
          },
          "The website uses no advertising, no audience measurement tool and no tracking cookie.",
        ],
      },
      {
        title: "What this data is used for",
        blocks: [
          {
            list: [
              "Running the service: accounts, team chat, project memory, the work of the server and the cook (basis: performing the service you use).",
              "Signing you in with a code sent by email, and writing to you about your account or the beta.",
              "Measuring credit usage, applying plan quotas and preventing abuse (basis: our legitimate interest in keeping the service safe and sustainable).",
              "Improving <br/> based on the feedback you send us.",
            ],
          },
        ],
      },
      {
        title: "Artificial intelligence",
        blocks: [
          "To answer and carry out orders, the project's messages, its memory and, for the cook, the content of the files it reads are sent to AI providers: Google (Gemini), Mistral AI, Groq and Z.ai. Vault secrets are excluded: the AI only sees their names.",
          "During the beta, <br/> uses these providers' free tiers. On these tiers, some of them may keep and use the content sent to improve their services; this is notably the case for Google's free Gemini API. So please do not share sensitive information in the chat during the beta.",
        ],
      },
      {
        title: "What happens on your machine",
        blocks: [
          "The cook works on the machine of the member who agrees to lend it, inside the project folder, according to the chosen permission mode. Files stay on that machine; only the excerpts needed for the order are sent to the AI, as described above.",
          "The website only stores, in your browser, your choice of light or dark mode.",
        ],
      },
      {
        title: "Where your data is processed",
        blocks: [
          {
            list: [
              "Server and database: in Europe (Microsoft Azure and Neon, Frankfurt).",
              "Attachments: Backblaze, in the United States.",
              "Website: Vercel, global network.",
              "Emails: Resend, sent from Ireland.",
              "AI: Google and Groq (United States), Mistral AI (France), Z.ai (outside the European Union).",
            ],
          },
          "Some of these providers are located outside the European Union. We choose providers that contractually commit to protecting the data they process on our behalf.",
        ],
      },
      {
        title: "Retention",
        blocks: [
          {
            list: [
              "Sign-in codes: 10 minutes.",
              "Your account and project content: as long as the account exists. A project's messages remain visible to its team after a member leaves.",
              "Machine sessions: until sign-out or until the machine is revoked.",
              "Invitation code requests: until the end of the beta.",
              "The AI usage log: as long as needed to track costs and billing.",
            ],
          },
        ],
      },
      {
        title: "Your rights",
        blocks: [
          "You can access your data, have it corrected, request a copy, object to processing or ask for its deletion.",
          "You can delete your account yourself from the extension (Settings, “Delete my account”).",
          PUBLISHER.email
            ? `For any other request, write to ${PUBLISHER.email}. We reply within one month.`
            : "For any other request, use the “Send feedback” command in the extension. We reply within one month.",
          "You may also lodge a complaint with the data protection authority of your country.",
        ],
      },
      {
        title: "Security",
        blocks: [
          "Exchanges are encrypted (HTTPS), vault secrets are encrypted at rest, sign-in tokens are only kept as fingerprints, and access to the internal dashboard is restricted by account and by section.",
        ],
      },
      {
        title: "Changes",
        blocks: [
          "This policy may change, in particular when the service opens commercially. The update date appears at the top of the page; in the event of a significant change, we will let you know in the extension or by email.",
        ],
      },
    ],
  },
};
