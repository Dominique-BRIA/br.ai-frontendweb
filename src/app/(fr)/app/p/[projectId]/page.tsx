import { Suspense } from "react";
import { ProjectChat } from "../../ProjectChat";

/**
 * Le chat d'un projet. Le projet est lu dans l'adresse par la page, au moment de l'afficher :
 * Next demande alors une zone de chargement autour.
 */
export default function ProjectPage() {
  return (
    <Suspense fallback={<p className="p-6 text-muted">Chargement…</p>}>
      <ProjectChat />
    </Suspense>
  );
}
