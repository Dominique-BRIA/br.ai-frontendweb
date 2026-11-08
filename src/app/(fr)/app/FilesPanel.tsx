"use client";

import {
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  File,
  FileArchive,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useApp } from "./AppShell";

interface ProjectFile {
  id: string;
  name: string;
  contentType: string;
  size: number;
  createdAt: string;
  uploadedBy: string | null;
}

interface Entry {
  path: string;
  size: number;
}

/** Ce que le navigateur peut afficher ; le reste se télécharge. */
const VIEWABLE = /\.(pdf|png|jpe?g|gif|webp|txt|md|csv)$/i;

const sizeOf = (bytes: number) =>
  bytes < 1024
    ? `${bytes} o`
    : bytes < 1024 * 1024
      ? `${Math.round(bytes / 1024)} Ko`
      : `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;

const dateOf = (iso: string) =>
  new Intl.DateTimeFormat("fr", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

const linkClass =
  "inline-flex items-center gap-1 font-semibold text-accent hover:underline";

function Links({
  name,
  download,
  view,
}: {
  name: string;
  download: string;
  view: string;
}) {
  return (
    <span className="flex shrink-0 items-center gap-3 text-xs">
      {VIEWABLE.test(name) && (
        <a href={view} target="_blank" rel="noreferrer" className={linkClass}>
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          Voir
        </a>
      )}
      <a href={download} className={linkClass}>
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        Télécharger
      </a>
    </span>
  );
}

/** Tous les fichiers du projet : ceux du cuisinier et ceux envoyés par les membres dans le chat. */
export function FilesPanel({ projectId }: { projectId: string }) {
  const { api, subscribe } = useApp();
  const [files, setFiles] = useState<ProjectFile[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [entries, setEntries] = useState<Record<string, Entry[] | "erreur">>(
    {},
  );

  const load = useCallback(async () => {
    try {
      const answer = await api<{ files: ProjectFile[] }>(
        `projects/${projectId}/files`,
      );
      setFiles(answer.files);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [api, projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(
    () =>
      subscribe((event) => {
        if (event.type === "message.created") void load();
      }),
    [subscribe, load],
  );

  const toggle = async (file: ProjectFile) => {
    if (open === file.id) {
      setOpen(null);
      return;
    }
    setOpen(file.id);
    if (Array.isArray(entries[file.id])) return;
    try {
      const answer = await api<{ entries: Entry[] }>(
        `attachments/${file.id}/files`,
      );
      setEntries((current) => ({ ...current, [file.id]: answer.entries }));
    } catch {
      setEntries((current) => ({ ...current, [file.id]: "erreur" }));
    }
  };

  if (failed && !files) {
    return (
      <p className="text-sm text-danger">Impossible de charger les fichiers.</p>
    );
  }
  if (!files) return <p className="text-sm text-muted">Chargement…</p>;
  if (files.length === 0) {
    return (
      <p className="text-sm text-muted">
        Les fichiers créés par le cuisinier et ceux envoyés dans le chat
        apparaîtront ici.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {files.map((file) => {
        const zip = file.contentType === "application/zip";
        const expanded = open === file.id;
        const content = entries[file.id];
        const url = `/api/app/attachments/${file.id}`;
        return (
          <li
            key={file.id}
            className="rounded-xl bg-card p-3 text-sm ring-1 ring-border"
          >
            <p className="flex items-start gap-2 font-semibold">
              {zip ? (
                <FileArchive
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  aria-hidden="true"
                />
              ) : (
                <File
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  aria-hidden="true"
                />
              )}
              <span className="min-w-0 break-words">{file.name}</span>
            </p>
            <p className="mt-1 text-xs text-muted">
              {file.uploadedBy ?? "Le cuisinier"} · {dateOf(file.createdAt)} ·{" "}
              {sizeOf(file.size)}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              {zip ? (
                <button
                  type="button"
                  onClick={() => void toggle(file)}
                  aria-expanded={expanded}
                  className={`${linkClass} text-xs`}
                >
                  {expanded ? (
                    <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  Voir le contenu
                </button>
              ) : (
                <span />
              )}
              <Links name={file.name} download={url} view={`${url}?view=1`} />
            </div>
            {expanded && (
              <div className="mt-2 border-t border-border pt-2">
                {content === "erreur" ? (
                  <p className="text-xs text-danger">Contenu illisible.</p>
                ) : !content ? (
                  <p className="text-xs text-muted">Chargement…</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {content.map((entry) => {
                      const target = `${url}/files/content?path=${encodeURIComponent(entry.path)}`;
                      return (
                        <li key={entry.path} className="flex flex-col gap-1">
                          <span className="min-w-0 break-words text-xs">
                            {entry.path}{" "}
                            <span className="text-muted">
                              ({sizeOf(entry.size)})
                            </span>
                          </span>
                          <Links
                            name={entry.path}
                            download={target}
                            view={`${target}&view=1`}
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
