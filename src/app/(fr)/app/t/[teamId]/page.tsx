import { Suspense } from "react";
import { TeamPage } from "../../TeamPage";

/** La page d'une équipe ; l'équipe est lue dans l'adresse, d'où la zone de chargement. */
export default function Page() {
  return (
    <Suspense fallback={<p className="p-6 text-muted">Chargement…</p>}>
      <TeamPage />
    </Suspense>
  );
}
