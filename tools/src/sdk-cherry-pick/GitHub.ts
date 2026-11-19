import spawnAsync from '@expo/spawn-async';

export type GitHub = {
  commentAsync(prNumber: number, body: string): Promise<void>;
  /** Asks GitHub, because the bot's shallow clone does not hold the history to check it. */
  branchContainsAsync(branch: string, sha: string): Promise<boolean>;
};

type PullRequestView = {
  state: string;
  mergeCommit: { oid: string };
  baseRefName: string;
  author: { login: string };
};

/** Calls GitHub with the `gh` CLI, which reads the token from GH_TOKEN. */
export function ghCli(repo: string): GitHub & {
  viewPullRequestAsync(
    prNumber: number
  ): Promise<{ mergeSha: string; baseBranch: string; author: string }>;
} {
  const gh = async (...args: string[]) =>
    (await spawnAsync('gh', [...args, '--repo', repo])).stdout.trim();
  return {
    async commentAsync(prNumber, body) {
      await gh('pr', 'comment', String(prNumber), '--body', body);
    },
    async branchContainsAsync(branch, sha) {
      const { stdout } = await spawnAsync('gh', [
        'api',
        `repos/${repo}/compare/${sha}...${branch}`,
        '--jq',
        '.status',
      ]);
      // "ahead" or "identical": every commit up to `sha` is on `branch`.
      return ['ahead', 'identical'].includes(stdout.trim());
    },
    async viewPullRequestAsync(prNumber) {
      const view: PullRequestView = JSON.parse(
        await gh('pr', 'view', String(prNumber), '--json', 'state,mergeCommit,baseRefName,author')
      );
      if (view.state !== 'MERGED') {
        throw new Error(`#${prNumber} is not merged, so there is nothing to backport.`);
      }
      return {
        mergeSha: view.mergeCommit.oid,
        baseBranch: view.baseRefName,
        author: view.author.login,
      };
    },
  };
}
