// Fetches profile, pinned projects and the full contribution history from the
// GitHub GraphQL API and writes them to src/data/github.json for the build.
//
// Token: GH_TOKEN or GITHUB_TOKEN, falling back to `gh auth token` locally.
// If no token is available or the request fails, the committed snapshot is
// kept so the site still builds.
import { execSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';

const LOGIN = 'cypherkunp';
const OUT = new URL('../src/data/github.json', import.meta.url);
const LEVELS = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];

function resolveToken() {
  const fromEnv = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (fromEnv) return fromEnv;
  try {
    return execSync('gh auth token', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return null;
  }
}

async function graphql(token, query, variables = {}) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (!res.ok || body.errors) {
    throw new Error(`GitHub GraphQL failed: ${res.status} ${JSON.stringify(body.errors ?? body)}`);
  }
  return body.data;
}

const PROFILE_QUERY = `
query ($login: String!) {
  user(login: $login) {
    login name bio location websiteUrl twitterUsername avatarUrl(size: 256) url
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes {
        ... on Repository {
          name description url homepageUrl stargazerCount forkCount pushedAt
          primaryLanguage { name color }
        }
      }
    }
    contributionsCollection { contributionYears }
  }
}`;

const YEAR_QUERY = `
query ($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

async function main() {
  const token = resolveToken();
  if (!token) {
    console.warn('fetch-github: no token found, keeping the existing snapshot.');
    return;
  }

  const { user } = await graphql(token, PROFILE_QUERY, { login: LOGIN });
  const years = [...user.contributionsCollection.contributionYears].sort((a, b) => a - b);
  const today = new Date().toISOString().slice(0, 10);

  // contributionsCollection spans at most one year, so ask for each year in turn.
  const days = [];
  for (const year of years) {
    const data = await graphql(token, YEAR_QUERY, {
      login: LOGIN,
      from: `${year}-01-01T00:00:00Z`,
      to: `${year}-12-31T23:59:59Z`,
    });
    for (const week of data.user.contributionsCollection.contributionCalendar.weeks) {
      for (const d of week.contributionDays) {
        if (d.date.startsWith(String(year)) && d.date <= today) {
          days.push([d.date, d.contributionCount, LEVELS.indexOf(d.contributionLevel)]);
        }
      }
    }
  }

  const { pinnedItems, contributionsCollection, ...profile } = user;
  const snapshot = {
    fetchedAt: new Date().toISOString(),
    profile,
    pinned: pinnedItems.nodes,
    contributions: { years, days },
  };
  await writeFile(OUT, JSON.stringify(snapshot) + '\n');
  console.log(`fetch-github: ${pinnedItems.nodes.length} pinned projects, ${days.length} days across ${years.length} years.`);
}

main().catch((err) => {
  console.warn(`::warning::fetch-github: ${err.message} (keeping the existing snapshot)`);
});
