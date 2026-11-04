import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Le nom « <br/> » ressemble à une balise HTML, que le rendu supprimerait : hors du code, on
 * l'écrit avec des entités pour qu'il s'affiche tel quel (comme dans l'extension).
 */
function escapeBrand(text: string): string {
  return text
    .split(/(```[\s\S]*?(?:```|$)|`[^`\n]*`)/)
    .map((part) =>
      part.startsWith("`")
        ? part
        : part
            .replaceAll("<br/>", "&lt;br/&gt;")
            .replaceAll("<br>.ia", "&lt;br&gt;.ia"),
    )
    .join("");
}

/** Rendu Markdown d'un message : listes, tableaux, code. Le HTML brut n'est jamais interprété. */
export const Markdown = memo(function Markdown({ text }: { text: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {escapeBrand(text)}
      </ReactMarkdown>
    </div>
  );
});
