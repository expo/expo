import type { Endpoints } from '@octokit/types';

import { fetch } from './fetch';

/** Guesses the repository URL based on the author profile URL and the package slug. */
export async function guessRepoUrl(authorUrl: string, slug: string) {
  if (/^https?:\/\/github.com\/[^/]+/.test(authorUrl)) {
    const normalizedSlug = slug.replace(/^@/, '').replace(/\//g, '-');
    return `${authorUrl}/${normalizedSlug}`;
  }
  return '';
}

/** Search GitHub to resolve an email to a GitHub account */
export async function findGitHubUserFromEmail(email: string): Promise<string | null> {
  const params = new URLSearchParams({ q: `${email} in:email` });
  const response = await fetch(`https://api.github.com/search/users?${params}`, {
    headers: {
      'User-Agent': 'create-expo-module',
    },
  });

  const json = (await response.json()) as Endpoints['GET /search/users']['response'];
  const data = json.data ?? json;
  if (data?.total_count > 0) {
    if (data.items?.[0]?.login) {
      return data.items[0].login;
    }
  }
  return await findGitHubUserFromEmailByCommits(email);
}

/** Search GitHub to resolve an email to a GitHub account, by searching commits instead of users */
export async function findGitHubUserFromEmailByCommits(email: string): Promise<string | null> {
  const params = new URLSearchParams({
    q: `author-email:${email}`,
    sort: 'author-date',
    per_page: '1',
  });
  const response = await fetch(`https://api.github.com/search/commits?${params}`, {
    headers: {
      'User-Agent': 'create-expo-module',
    },
  });

  const json = (await response.json()) as Endpoints['GET /search/commits']['response'];
  const data = json.data ?? json;
  if (data?.total_count > 0) {
    return data.items[0].author?.login ?? null;
  }

  return null;
}
