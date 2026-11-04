/** Ce que la plateforme web reçoit du serveur <br/> (repris du protocole de l'extension). */

export type Author =
  | { kind: "member"; userId: string; displayName: string }
  | { kind: "former_member" }
  | { kind: "serveur" }
  | { kind: "cuisinier" };

export interface Member {
  userId: string;
  displayName: string;
  role: "chef" | "membre";
  online: boolean;
}

export interface Project {
  id: string;
  teamId: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
  myRole: "chef" | "membre";
  members: Member[];
  projects: Project[];
}

export interface Workspace {
  user: { id: string; displayName: string; email: string };
  teams: Team[];
}

export interface Message {
  id: string;
  projectId: string;
  author: Author;
  body: string;
  replyTo: { id: string; author: Author; excerpt: string } | null;
  mentions: string[];
  attachments: {
    id: string;
    name: string;
    contentType: string;
    size: number;
  }[];
  createdAt: string;
}

export interface MemoryItem {
  id: string;
  type: "decision" | "question" | "task" | "compromise";
  status: "open" | "resolved" | "stopped";
  text: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  kind: "mention" | "reply" | "order";
  projectId: string;
  projectName: string;
  teamName: string;
  author: string;
  text: string;
  createdAt: string;
}

/** Événement temps réel ; seuls les champs utiles à la page sont typés. */
export type LiveEvent =
  | { type: "message.created"; message: Message }
  | { type: "memory.changed"; projectId: string }
  | { type: "workspace.changed" }
  | { type: "order.updated" }
  | { type: "presence.changed"; userId: string; online: boolean }
  | { type: string };

export const authorName = (author: Author) =>
  author.kind === "member"
    ? author.displayName
    : author.kind === "serveur"
      ? "Le serveur"
      : author.kind === "cuisinier"
        ? "Le cuisinier"
        : "Ancien membre";

export const isAgent = (author: Author) =>
  author.kind === "serveur" || author.kind === "cuisinier";
