import type { PullRequestRef } from './types';
import { normalizeHeadSha, parsePublicPullRequestUrl } from './validation';

type GitHubPullRequestResponse = {
  head: {
    sha: string;
  };
};

export async function fetchPublicPullRequestRefAsync(prUrl: string): Promise<PullRequestRef> {
  const parsed = parsePublicPullRequestUrl(prUrl);
  const response = await fetch(
    `https://api.github.com/repos/${parsed.owner}/${parsed.name}/pulls/${parsed.pullNumber}`,
    {
      headers: {
        accept: 'application/vnd.github+json',
        ...(process.env.GITHUB_TOKEN
          ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch pull request metadata: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as GitHubPullRequestResponse;
  return {
    ...parsed,
    headSha: normalizeHeadSha(data.head.sha),
  };
}
