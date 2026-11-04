import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/** Retour à l'accueil de la plateforme, en haut de chaque page. */
export function BackLink({
  href = "/app",
  label = "Retour",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      title={label}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-sm text-muted ring-1 ring-border transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
