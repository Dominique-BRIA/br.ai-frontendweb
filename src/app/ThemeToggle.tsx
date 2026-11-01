"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { THEME_KEY } from "./theme";

const systemDark = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;

/**
 * Bouton du mode clair et du mode sombre. Tant que le visiteur n'a rien choisi, la page suit
 * le réglage de son système ; son choix est ensuite retenu.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    // Sans choix enregistré, la page suit les changements du réglage du système.
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (localStorage.getItem(THEME_KEY)) return;
      document.documentElement.classList.toggle("dark", systemDark());
      setDark(systemDark());
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const change = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      // Sans stockage, le choix vaut pour cette page seulement.
    }
  };

  const label = dark ? "Passer en mode clair" : "Passer en mode sombre";
  const Icon = dark ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={change}
      title={label}
      aria-label={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-accent-soft hover:text-accent ${className}`}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
