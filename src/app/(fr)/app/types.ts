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
  | { type: "order.updated"; order: Order }
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

export interface Order {
  id: string;
  projectId: string;
  number: number;
  title: string;
  brief: string;
  status: "pending" | "running" | "done" | "failed" | "stopped";
  requestedBy: Author;
  machine: { userId: string; displayName: string } | null;
  summary: string | null;
  branch: string | null;
  commit: string | null;
  pushed: boolean;
  pullRequest: { number: number; url: string } | null;
  merged: boolean;
  handoffNote: string | null;
  steps: {
    at: string;
    kind: "info" | "read" | "write" | "command" | "error";
    text: string;
  }[];
  createdAt: string;
}

export interface TeamUsage {
  plan: {
    id: string;
    name: string;
    maxMembers: number;
    maxProjects: number;
    monthlyCredits: number;
  };
  used: number;
  bonus: number;
  quota: number;
  byMember: { userId: string; displayName: string; credits: number }[];
}
