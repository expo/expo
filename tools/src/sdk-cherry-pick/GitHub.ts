import spawnAsync from '@expo/spawn-async';

export type GitHub = {
  commentAsync(prNumber: number, body: string): Promise<void>;
};

type PullRequestView = {
  state: string;
  mergeCommit: { oid: string };
  baseRefName: string;
};

/** Calls GitHub with the `gh` CLI, which reads the token from GH_TOKEN. */
export function ghCli(repo: string): GitHub & {
  viewPullRequestAsync(prNumber: number): Promise<{ mergeSha: string; baseBranch: string }>;
} {
  const gh = async (...args: string[]) =>
    (await spawnAsync('gh', [...args, '--repo', repo])).stdout.trim();
  return {
    async commentAsync(prNumber, body) {
      await gh('pr', 'comment', String(prNumber), '--body', body);
    },
    async viewPullRequestAsync(prNumber) {
      const view: PullRequestView = JSON.parse(
        await gh('pr', 'view', String(prNumber), '--json', 'state,mergeCommit,baseRefName')
      );
      if (view.state !== 'MERGED') {
        throw new Error(`#${prNumber} is not merged, so there is nothing to backport.`);
      }
      return { mergeSha: view.mergeCommit.oid, baseBranch: view.baseRefName };
    },
  };
}
