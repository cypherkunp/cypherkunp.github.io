// Hand-written content. Everything else on the page comes from GitHub
// (src/data/github.json, refreshed by scripts/fetch-github.mjs).

export const intro = {
  headline: 'Software craftsman building for the web and AI.',
  // DRAFT: rewrite in your own words.
  body: [
    "I'm Devvrat, a software engineer based in London. I build web applications, developer tools and, lately, AI agents and the skills that make them useful.",
    'This page is a live view of my work on GitHub: the projects I have pinned and every contribution since 2012.',
  ],
};

export const links = [
  { label: 'devvrat.cc', href: 'https://devvrat.cc/' },
  { label: 'GitHub', href: 'https://github.com/cypherkunp' },
  { label: 'X', href: 'https://x.com/devvrathq' },
];

// Optional per-project text that replaces the GitHub description.
// Keyed by repository name. Leave a project out to use its GitHub description.
export const projectOverrides: Record<string, { description?: string }> = {
  // 'resume-builder': { description: '…' },
  // 'dark-matter': { description: '…' },
};
