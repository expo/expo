import spawnAsync from '@expo/spawn-async';

export type PullRequestDraft = { base: string; head: string; title: string; body: string };

export type GitHub = {
  /** Returns the number of the new pull request. */
  createPullRequestAsync(pullRequest: PullRequestDraft): Promise<number>;
  addLabelAsync(prNumber: number, label: string): Promise<void>;
  commentAsync(prNumber: number, body: string): Promise<void>;
};

type PullRequestView = {
  state: string;
  mergeCommit: { oid: string };
  title: string;
  author: { login: string };
};

/** Calls GitHub with the `gh` CLI, which reads the token from GH_TOKEN. */
export function ghCli(repo: string): GitHub & {
  viewPullRequestAsync(
    prNumber: number
  ): Promise<{ mergeSha: string; title: string; author: string }>;
} {
  const gh = async (...args: string[]) =>
    (await spawnAsync('gh', [...args, '--repo', repo])).stdout.trim();
  return {
    async createPullRequestAsync({ base, head, title, body }) {
      const url = await gh(
        'pr',
        'create',
        '--base',
        base,
        '--head',
        head,
        '--title',
        title,
        '--body',
        body
      );
      const number = Number(url.split('/').pop());
      if (Number.isNaN(number)) {
        throw new Error(
          `"gh pr create" printed "${url}", which does not end in a pull request number. Check whether the pull request from ${head} was opened.`
        );
      }
      return number;
    },
    async addLabelAsync(prNumber, label) {
      await gh('pr', 'edit', String(prNumber), '--add-label', label);
    },
    async commentAsync(prNumber, body) {
      await gh('pr', 'comment', String(prNumber), '--body', body);
    },
    async viewPullRequestAsync(prNumber) {
      const view: PullRequestView = JSON.parse(
        await gh('pr', 'view', String(prNumber), '--json', 'state,mergeCommit,title,author')
      );
      if (view.state !== 'MERGED') {
        throw new Error(`#${prNumber} is not merged, so there is nothing to backport.`);
      }
      return { mergeSha: view.mergeCommit.oid, title: view.title, author: view.author.login };
    },
  };
}
