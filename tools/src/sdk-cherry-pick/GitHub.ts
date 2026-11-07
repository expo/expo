import { BotBackport, CommitSummary, OpenPullRequest, parseCommitSummaries } from './Decisions';
import { Cli, FatalError, Output, stripTrailingNewlines } from './Process';

/** The fields of `gh pr view`, each as `jq -r` prints it. */
export type PullRequestView = {
  state: string;
  baseRefName: string;
  mergeSha: string;
  title: string;
  author: string;
};

/** The calls to GitHub. The `gh` CLI makes them with the token in GH_TOKEN. */
export type GitHubClient = {
  viewPullRequestAsync(prNumber: string): Promise<PullRequestView>;
  /** The `status` of the compare API: `ahead`, `behind`, `identical`, or `diverged`. */
  compareStatusAsync(base: string, head: string): Promise<string>;
  /** The commits on the target branch that main does not have, that is, each commit since the cut. */
  commitsSinceCutAsync(targetBranch: string): Promise<CommitSummary[]>;
  listBotBackportsAsync(workBranch: string, targetBranch: string): Promise<BotBackport[]>;
  searchOpenBackportsAsync(targetBranch: string, prNumber: string): Promise<OpenPullRequest[]>;
  /** Returns the URL of the new pull request. */
  createPullRequestAsync(options: {
    base: string;
    head: string;
    title: string;
    bodyFile: string;
  }): Promise<string>;
  /** `pullRequest` is a number or a URL. */
  addLabelAsync(pullRequest: string, label: string): Promise<void>;
  commentAsync(prNumber: string, body: string): Promise<void>;
};

type PullRequestViewJson = {
  state?: unknown;
  baseRefName?: unknown;
  mergeCommit?: { oid?: unknown } | null;
  title?: unknown;
  author?: { login?: unknown } | null;
};

function jqRaw(value: unknown): string {
  return stripTrailingNewlines(typeof value === 'string' ? value : JSON.stringify(value ?? null));
}

/** Returns undefined when the text is not JSON. */
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export class GhCli implements GitHubClient {
  private readonly gh = new Cli('gh');

  constructor(
    readonly repo: string,
    private readonly output: Output
  ) {}

  private async parseListAsync<T>(text: string, command: string): Promise<T[]> {
    const list = parseJson(text);
    if (!Array.isArray(list)) {
      await this.output.untrusted(`${text}\n`, 'stderr');
      throw new FatalError(
        `\`${command}\` did not print a JSON array, so the bot cannot tell which pull requests exist. The run log shows what it printed. Re-run the failed jobs of the workflow run.`
      );
    }
    return list;
  }

  async viewPullRequestAsync(prNumber: string): Promise<PullRequestView> {
    const json = await this.gh.outputAsync([
      'pr',
      'view',
      prNumber,
      '--repo',
      this.repo,
      '--json',
      'state,baseRefName,mergeCommit,title,author',
    ]);
    const parsed = parseJson(json);
    // jq read nothing from text that is not JSON, so each field was empty. The caller then fails
    // with "#N is not merged."
    if (parsed === undefined) {
      await this.output.untrusted(`${json}\n`, 'stderr');
      return { state: '', baseRefName: '', mergeSha: '', title: '', author: '' };
    }
    const view = (parsed ?? {}) as PullRequestViewJson;
    return {
      state: jqRaw(view.state),
      baseRefName: jqRaw(view.baseRefName),
      mergeSha: jqRaw(view.mergeCommit?.oid),
      title: jqRaw(view.title),
      author: jqRaw(view.author?.login),
    };
  }

  compareStatusAsync(base: string, head: string): Promise<string> {
    return this.gh.outputAsync([
      'api',
      `repos/${this.repo}/compare/${base}...${head}?per_page=1`,
      '--jq',
      '.status',
    ]);
  }

  // The checkout has only the tip of main, and a shallow git fetch of that range fails on GitHub
  // when the range is empty, so the compare API lists the commits.
  async commitsSinceCutAsync(targetBranch: string): Promise<CommitSummary[]> {
    const output = await this.gh.outputAsync([
      'api',
      '--paginate',
      `repos/${this.repo}/compare/main...${targetBranch}?per_page=100`,
      '--jq',
      '.commits[] | "\\(.sha) \\(.commit.message | split("\\n")[0])"',
    ]);
    return parseCommitSummaries(output);
  }

  async listBotBackportsAsync(workBranch: string, targetBranch: string): Promise<BotBackport[]> {
    const json = await this.gh.outputAsync([
      'pr',
      'list',
      '--repo',
      this.repo,
      '--head',
      workBranch,
      '--base',
      targetBranch,
      '--state',
      'all',
      '--json',
      'url,state,headRepository,headRepositoryOwner',
    ]);
    return this.parseListAsync(json, 'gh pr list --head');
  }

  async searchOpenBackportsAsync(
    targetBranch: string,
    prNumber: string
  ): Promise<OpenPullRequest[]> {
    const json = await this.gh.outputAsync([
      'pr',
      'list',
      '--repo',
      this.repo,
      '--base',
      targetBranch,
      '--state',
      'open',
      '--search',
      `${prNumber} in:title`,
      '--limit',
      '100',
      '--json',
      'number,title',
    ]);
    return this.parseListAsync(json, 'gh pr list --search');
  }

  createPullRequestAsync(options: {
    base: string;
    head: string;
    title: string;
    bodyFile: string;
  }): Promise<string> {
    return this.gh.outputAsync([
      'pr',
      'create',
      '--repo',
      this.repo,
      '--base',
      options.base,
      '--head',
      options.head,
      '--title',
      options.title,
      '--body-file',
      options.bodyFile,
    ]);
  }

  async addLabelAsync(pullRequest: string, label: string): Promise<void> {
    await this.gh.runAsync(['pr', 'edit', pullRequest, '--repo', this.repo, '--add-label', label], {
      stdout: 'inherit',
    });
  }

  async commentAsync(prNumber: string, body: string): Promise<void> {
    await this.gh.runAsync(['pr', 'comment', prNumber, '--repo', this.repo, '--body', body], {
      stdout: 'inherit',
    });
  }
}
