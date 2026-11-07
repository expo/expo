// Keep this rule the same as the one in tools/src/commands/CheckSdkPrsCommand.ts
// (`et check-sdk-prs`): the first match in a commit subject is the pull request.
export const PULL_REQUEST_REFERENCE = /\(#([0-9]+)\)/;

export type CommitSummary = { sha: string; subject: string };

/** A pull request from `gh pr list --json url,state,headRepository,headRepositoryOwner`. */
export type BotBackport = {
  url: string;
  state: string;
  headRepository: { name: string } | null;
  headRepositoryOwner: { login: string } | null;
};

/** A pull request from `gh pr list --json number,title`. */
export type OpenPullRequest = { number: number; title: string };

/** Reads `<sha> <subject>` lines. */
export function parseCommitSummaries(output: string): CommitSummary[] {
  return output.split('\n').flatMap((line) => {
    const match = /^[ \t]*([^ \t]+)[ \t]*(.*?)[ \t]*$/s.exec(line);
    return match ? [{ sha: match[1], subject: match[2] }] : [];
  });
}

/** Finds the commit whose subject names the pull request in its first `(#N)`. */
export function findBackportCommit(
  commits: readonly CommitSummary[],
  prNumber: string
): CommitSummary | undefined {
  return commits.find((commit) => PULL_REQUEST_REFERENCE.exec(commit.subject)?.[1] === prNumber);
}

/**
 * Finds the URL of the first merged, open, and closed backport. `gh pr list --head` matches the
 * branch name in any repository, so a fork can use the same name. Only `repo` counts.
 */
export function selectBotBackports(
  pullRequests: readonly BotBackport[],
  repo: string
): { merged?: string; open?: string; closed?: string } {
  const ours = pullRequests.filter(
    (pr) => `${pr.headRepositoryOwner?.login ?? null}/${pr.headRepository?.name ?? null}` === repo
  );
  const urlOf = (state: string) => ours.find((pr) => pr.state === state)?.url;
  const backports = { merged: urlOf('MERGED'), open: urlOf('OPEN'), closed: urlOf('CLOSED') };
  return Object.fromEntries(Object.entries(backports).filter(([, url]) => url));
}

/** A person can open a backport from any branch. Its title names the pull request as `(#N)`. */
export function findManualBackport(
  pullRequests: readonly OpenPullRequest[],
  prNumber: string
): number | undefined {
  return pullRequests.find((pr) => pr.title.includes(`(#${prNumber})`))?.number;
}
