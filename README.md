# \<br\>.ia — site web

Le site de présentation de \<br\>.ia et, plus tard, le tableau de bord d'administration. Next.js 16, Tailwind CSS 4.

Les interfaces suivent la charte du dépôt backend : [`docs/charte-interfaces.md`](https://github.com/Dominique-BRIA/br.ai-backend/blob/main/docs/charte-interfaces.md).

## Démarrer en local

```sh
npm install
npm run dev
```

Le site s'ouvre sur `http://localhost:3000`.

## Commandes

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Site en développement |
| `npm run build` puis `npm start` | Version construite |
| `npm run typecheck` | Vérification des types |
| `npm run check` | Vérification du style (Biome) ; `npm run format` corrige |

Next.js 16 diffère des versions précédentes : avant d'écrire du code, consulter la documentation fournie dans `node_modules/next/dist/docs/`.
