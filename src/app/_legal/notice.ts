import type { Lang } from "../i18n";
import type { LegalDocument } from "./LegalPage";
import { PUBLISHER } from "./publisher";

const known = (...lines: (string | null | false)[]) =>
  lines.filter((line): line is string => typeof line === "string");

/** Mentions légales : qui édite le site, qui l'héberge, à qui appartient quoi. */
export const NOTICE: Record<Lang, LegalDocument> = {
  fr: {
    title: "Mentions légales",
    sections: [
      {
        title: "Éditeur",
        blocks: [
          "Le site br.garah.me et le service <br/> (Retour à la ligne), composé de ce site, du serveur et de l'extension pour Visual Studio Code, sont édités par :",
          {
            list: known(
              PUBLISHER.name,
              PUBLISHER.status,
              PUBLISHER.registration &&
                `Immatriculation : ${PUBLISHER.registration}`,
              PUBLISHER.address && `Adresse : ${PUBLISHER.address}`,
              PUBLISHER.email && `Contact : ${PUBLISHER.email}`,
            ),
          },
          `Directeur de la publication : ${PUBLISHER.name}.`,
          PUBLISHER.email
            ? `Pour toute question, écrivez à ${PUBLISHER.email}.`
            : "Pour toute question pendant la bêta, utilisez la commande « Envoyer un retour » de l'extension.",
        ],
      },
      {
        title: "Hébergement",
        blocks: [
          "Le site et le service s'appuient sur les prestataires suivants :",
          {
            list: [
              "Site web : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (vercel.com).",
              "Serveur : Microsoft Corporation (Azure), One Microsoft Way, Redmond, WA 98052, États-Unis, dans un centre de données situé en Europe.",
              "Base de données : Neon, Inc. (neon.com), centre de données de Francfort, Allemagne.",
              "Pièces jointes : Backblaze, Inc. (backblaze.com), centre de données situé aux États-Unis.",
              "Envoi des e-mails : Resend, Inc. (resend.com), envoi depuis l'Irlande.",
            ],
          },
        ],
      },
      {
        title: "Propriété intellectuelle",
        blocks: [
          "Le nom <br/>, le nom « Retour à la ligne », le logo, l'emblème, les textes, les images, les vidéos et le code du site et du service appartiennent à leur éditeur. Toute reproduction ou réutilisation sans autorisation écrite est interdite.",
          "Les contenus créés par les utilisateurs (messages, fichiers, code, documents) restent leur propriété, dans les conditions décrites par les conditions d'utilisation.",
        ],
      },
      {
        title: "Données personnelles",
        blocks: [
          "La façon dont <br/> traite les données personnelles est décrite dans la politique de confidentialité, accessible en bas de chaque page du site.",
        ],
      },
    ],
  },
  en: {
    title: "Legal notice",
    sections: [
      {
        title: "Publisher",
        blocks: [
          "The br.garah.me website and the <br/> service (Retour à la ligne), made up of this website, the server and the Visual Studio Code extension, are published by:",
          {
            list: known(
              PUBLISHER.name,
              PUBLISHER.status,
              PUBLISHER.registration &&
                `Registration: ${PUBLISHER.registration}`,
              PUBLISHER.address && `Address: ${PUBLISHER.address}`,
              PUBLISHER.email && `Contact: ${PUBLISHER.email}`,
            ),
          },
          `Publication director: ${PUBLISHER.name}.`,
          PUBLISHER.email
            ? `For any question, write to ${PUBLISHER.email}.`
            : "For any question during the beta, use the “Send feedback” command in the extension.",
        ],
      },
      {
        title: "Hosting",
        blocks: [
          "The website and the service rely on the following providers:",
          {
            list: [
              "Website: Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, United States (vercel.com).",
              "Server: Microsoft Corporation (Azure), One Microsoft Way, Redmond, WA 98052, United States, in a data centre located in Europe.",
              "Database: Neon, Inc. (neon.com), Frankfurt data centre, Germany.",
              "Attachments: Backblaze, Inc. (backblaze.com), data centre located in the United States.",
              "Email delivery: Resend, Inc. (resend.com), sent from Ireland.",
            ],
          },
        ],
      },
      {
        title: "Intellectual property",
        blocks: [
          "The <br/> name, the “Retour à la ligne” name, the logo, the emblem, and the texts, images, videos and code of the website and the service belong to their publisher. Any reproduction or reuse without written permission is prohibited.",
          "Content created by users (messages, files, code, documents) remains their property, under the conditions set out in the terms of use.",
        ],
      },
      {
        title: "Personal data",
        blocks: [
          "How <br/> processes personal data is described in the privacy policy, linked at the bottom of every page of the website.",
        ],
      },
    ],
  },
};
