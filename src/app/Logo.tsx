/** Le logo complet « Retour à la ligne », en version claire ou sombre selon le thème du visiteur. */
export function Logo({ className }: { className?: string }) {
  return (
    <picture>
      <source srcSet="/logo-sombre.svg" media="(prefers-color-scheme: dark)" />
      <img
        src="/logo-clair.svg"
        alt="<br/> — Retour à la ligne : redonner un sens au travail d’équipe"
        width={1000}
        height={1180}
        className={className}
      />
    </picture>
  );
}
