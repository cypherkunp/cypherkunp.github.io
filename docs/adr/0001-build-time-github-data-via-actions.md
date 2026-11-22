# 1. Build-time GitHub data, deployed by GitHub Actions

Date: 2026-11-22

## Context

The page shows Pinned Projects and the full Contribution Timeline. GitHub only
exposes both through its authenticated GraphQL API, and this is a static
GitHub Pages site, so the browser cannot call that API without leaking a token.

## Decision

A scheduled GitHub Actions workflow fetches the data with the workflow token,
builds the site with Astro, and deploys it with the Pages "GitHub Actions"
source. It runs on push to `development`, nightly, and on demand. A Snapshot is
also committed so local builds work offline or without a token.

`development` is the default branch (scheduled workflows only run from the
default branch); the old `master` branch of hand-pushed build output is retired.

## Alternatives considered

- Hand-refreshed hard-coded data: no infrastructure, but goes stale.
- Third-party unauthenticated contributions APIs from the browser: cannot get
  Pinned Projects and depends on someone else's uptime.
- Keep deploying build output to `master` with `gh-pages`: works, but cron
  would have to live on `master` alongside generated files.

## Consequences

Data on the page is up to one day old. Pages settings must use the Actions
source; the repo can no longer be deployed by pushing to `master`.
