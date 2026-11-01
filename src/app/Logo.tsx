/**
 * Le logo complet « Retour à la ligne », sans fond : version claire en mode clair, sombre en
 * mode sombre. Il suit le thème choisi sur le site (classe « dark »), pas seulement le système.
 */
export function Logo({ className = "" }: { className?: string }) {
  const alt =
    "<br/> — Retour à la ligne : redonner un sens au travail d’équipe";
  return (
    <>
      {/* biome-ignore lint/performance/noImgElement: image vectorielle fixe, inutile de passer par l'optimiseur. */}
      <img
        src="/logo-clair.svg"
        alt={alt}
        width={1000}
        height={1180}
        className={`dark:hidden ${className}`}
      />
      {/* biome-ignore lint/performance/noImgElement: image vectorielle fixe, inutile de passer par l'optimiseur. */}
      <img
        src="/logo-sombre.svg"
        alt={alt}
        width={1000}
        height={1180}
        className={`hidden dark:block ${className}`}
      />
    </>
  );
}

/** L'emblème seul, sans fond ni texte, pour les petites places (barre latérale). */
export function Emblem({ className = "" }: { className?: string }) {
  return (
    <>
      {/* biome-ignore lint/performance/noImgElement: image vectorielle fixe, inutile de passer par l'optimiseur. */}
      <img
        src="/icone-claire.svg"
        alt=""
        width={256}
        height={256}
        className={`dark:hidden ${className}`}
      />
      {/* biome-ignore lint/performance/noImgElement: image vectorielle fixe, inutile de passer par l'optimiseur. */}
      <img
        src="/icone-sombre.svg"
        alt=""
        width={256}
        height={256}
        className={`hidden dark:block ${className}`}
      />
    </>
  );
}
