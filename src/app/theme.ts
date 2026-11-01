/** Clé du choix de thème (« light » ou « dark ») dans le stockage du navigateur. */
export const THEME_KEY = "br-theme";

/**
 * Script lancé avant l'affichage, pour que la page s'ouvre directement dans le bon thème :
 * la classe « dark » est posée sur <html> d'après le choix du visiteur, ou, sans choix,
 * d'après le réglage de son système.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");var d=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})();`;
