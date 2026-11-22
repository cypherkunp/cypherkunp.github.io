# cypherkunp.github.io

A single page: a short intro, my pinned GitHub projects, and a contribution
timeline covering every year since 2012. Built with [Astro](https://astro.build).

## How it works

- `scripts/fetch-github.mjs` pulls profile, pinned projects and the full
  contribution calendar from the GitHub GraphQL API into `src/data/github.json`.
  Locally it uses `gh auth token`; in CI it uses the workflow token.
- `src/data/site.ts` holds the hand-written parts: intro text, links, and
  optional per-project description overrides.
- `.github/workflows/deploy.yml` fetches, builds and deploys to GitHub Pages on
  every push to `development`, weekly, and on demand.

## Develop

```sh
npm install
npm run fetch-data   # refresh the snapshot (optional)
npm run dev
```
