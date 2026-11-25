import spawnAsync from '@expo/spawn-async';

/** A pull request below the backported one in its GitHub stack. */
export type StackEntry = {
  number: number;
  labels: string[];
  /** Missing when the pull request is not merged. */
  mergeSha?: string;
  mergedAt?: string;
};

export type GitHub = {
  commentAsync(prNumber: number, body: string): Promise<void>;
  /** Asks GitHub, because the bot's shallow clone does not hold the history to check it. */
  branchContainsAsync(branch: string, sha: string): Promise<boolean>;
  /** Whether a commit on `branch` after `since` has the `(cherry picked from commit <sha>)` line. */
  branchHasCherryPickAsync(branch: string, sha: string, since: string): Promise<boolean>;
};

type PullRequestView = {
  state: string;
  mergeCommit: { oid: string };
  author: { login: string };
};

type StackView = {
  data: {
    repository: {
      pullRequest: {
        stackEntry: { position: number } | null;
        stack: {
          entries: {
            nodes: {
              position: number;
              pullRequest: {
                number: number;
                mergedAt: string | null;
                mergeCommit: { oid: string } | null;
                labels: { nodes: { name: string }[] };
              };
            }[];
          };
        } | null;
      };
    };
  };
};

const STACK_QUERY = `query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      stackEntry { position }
      stack {
        entries(first: 100) {
          nodes {
            position
            pullRequest { number mergedAt mergeCommit { oid } labels(first: 100) { nodes { name } } }
          }
        }
      }
    }
  }
}`;

/** Calls GitHub with the `gh` CLI, which reads the token from GH_TOKEN. */
export function ghCli(repo: string): GitHub & {
  viewPullRequestAsync(
    prNumber: number
  ): Promise<{ mergeSha: string; author: string; stackBelow: StackEntry[] }>;
} {
  const gh = async (...args: string[]) =>
    (await spawnAsync('gh', [...args, '--repo', repo])).stdout.trim();
  const ghApi = async (...args: string[]) => (await spawnAsync('gh', ['api', ...args])).stdout;

  const readStackBelowAsync = async (prNumber: number): Promise<StackEntry[]> => {
    const [owner, name] = repo.split('/');
    const view: StackView = JSON.parse(
      await ghApi(
        'graphql',
        '-f',
        `query=${STACK_QUERY}`,
        '-f',
        `owner=${owner}`,
        '-f',
        `name=${name}`,
        '-F',
        `number=${prNumber}`
      )
    );
    const { stackEntry, stack } = view.data.repository.pullRequest;
    if (!stackEntry || !stack) {
      return [];
    }
    return stack.entries.nodes
      .filter((entry) => entry.position < stackEntry.position)
      .sort((a, b) => a.position - b.position)
      .map(({ pullRequest }) => ({
        number: pullRequest.number,
        labels: pullRequest.labels.nodes.map((label) => label.name),
        mergeSha: pullRequest.mergeCommit?.oid,
        mergedAt: pullRequest.mergedAt ?? undefined,
      }));
  };

  return {
    async commentAsync(prNumber, body) {
      await gh('pr', 'comment', String(prNumber), '--body', body);
    },
    async branchContainsAsync(branch, sha) {
      const status = await ghApi(`repos/${repo}/compare/${sha}...${branch}`, '--jq', '.status');
      // "ahead" or "identical": every commit up to `sha` is on `branch`.
      return ['ahead', 'identical'].includes(status.trim());
    },
    async branchHasCherryPickAsync(branch, sha, since) {
      const messages = await ghApi(
        '--paginate',
        `repos/${repo}/commits?sha=${encodeURIComponent(branch)}&since=${encodeURIComponent(since)}&per_page=100`,
        '--jq',
        '.[].commit.message'
      );
      return messages.includes(`(cherry picked from commit ${sha})`);
    },
    async viewPullRequestAsync(prNumber) {
      const view: PullRequestView = JSON.parse(
        await gh('pr', 'view', String(prNumber), '--json', 'state,mergeCommit,author')
      );
      if (view.state !== 'MERGED') {
        throw new Error(`#${prNumber} is not merged, so there is nothing to backport.`);
      }
      return {
        mergeSha: view.mergeCommit.oid,
        author: view.author.login,
        // A failed read throws, so the bot backports nothing instead of skipping the stack check.
        stackBelow: await readStackBelowAsync(prNumber),
      };
    },
  };
}
