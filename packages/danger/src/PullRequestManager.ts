import { Octokit } from '@octokit/rest';
import { GitHubPRDSL } from 'danger/distribution/dsl/GitHubDSL';

import { GithubApiWrapper } from './GithubApiWrapper';
import { getPackageChangelogRelativePath } from './Utils';

export enum ChangelogEntryType {
  NOT_INCLUDED = -2,
  SKIP = -1,
  BUG_FIXES = 0,
  NEW_FEATURES = 1,
  BREAKING_CHANGES = 2,
}

export type ChangelogEntry = {
  type: ChangelogEntryType;
  message: string;
};

export const DEFAULT_CHANGELOG_ENTRY_KEY = 'default' as const;

export type ChangelogEntries = {
  [DEFAULT_CHANGELOG_ENTRY_KEY]: ChangelogEntry;
  [key: string]: ChangelogEntry;
};

export type PullRequest = GitHubPRDSL | Octokit.PullsListResponseItem;

type ParsingResult = {
  packageName: string | typeof DEFAULT_CHANGELOG_ENTRY_KEY;
  type: ChangelogEntryType;
};

const dangerMessage = `Add missing changelog`;
const dangerTags = `[danger][bot]`;

export class PullRequestManager {
  private _shouldGeneratePR = false;
  private changelogSection: string[] = [];
  private skip = false;

  constructor(private pullRequest: PullRequest, private githubApi: GithubApiWrapper) {
    this.preprocessPR();
  }

  shouldGeneratePR() {
    return this._shouldGeneratePR;
  }

  /**
   * Gets suggested changelog entries from PR provided in the constructor.
   *
   * If PR doesn't contain `# Changelog` section, this method returns:
   * {
   *   [DEFAULT_CHANGELOG_ENTRY_KEY]: <title of this pr without tags>
   * }
   * Otherwise, it tries to parse PR's body.
   */
  parseChangelogSuggestionFromDescription(): ChangelogEntries {
    const changelogEntries = {
      [DEFAULT_CHANGELOG_ENTRY_KEY]: {
        type: this.skip ? ChangelogEntryType.SKIP : ChangelogEntryType.NOT_INCLUDED,
        message: this.pullRequest.title.replace(/\[.*\]/, '').trim(),
      },
    };

    const parseLine: (line: string) => void = line => {
      const parsingResult = this.parseTagsFromLine(line);
      const message = line.replace(/\[.*\]/, '').trim();
      // we skip entries without message
      const type = message.length == 0 ? ChangelogEntryType.SKIP : parsingResult.type;

      changelogEntries[parsingResult.packageName] = {
        type,
        message,
      };
    };

    // skip option should be more important than title. So, we don't have to parse title.
    if (!this.skip) {
      parseLine(this.pullRequest.title);
    }

    this.changelogSection.forEach(parseLine);

    return changelogEntries;
  }

  private preprocessPR() {
    const changelogSection = this.pullRequest.body.match(/#\schangelog(([^#]*?)\s?)*/i)?.[0];
    if (changelogSection) {
      this.changelogSection = changelogSection
        .split('\n')
        .slice(1)
        .map(line => line.replace(/^\s*-/, '').trim())
        .filter(line => {
          if (!line.length) {
            return false;
          }
          if (line === 'skip') {
            this.skip = true;
            return false;
          }
          if (line === 'generate') {
            this._shouldGeneratePR = true;
            return false;
          }

          return true;
        });
    }
  }

  async createOrUpdatePRAsync(
    missingEntries: { packageName: string; content: string }[]
  ): Promise<PullRequest | null> {
    const dangerHeadRef = `@danger/add-missing-changelog-to-${this.pullRequest.number}`;
    const dangerBaseRef = this.pullRequest.head.ref;

    const fileMap = missingEntries.reduce(
      (prev, current) => ({
        ...prev,
        [getPackageChangelogRelativePath(current.packageName)]: current.content,
      }),
      {}
    );

    await this.githubApi.createOrUpdateBranchFromFileMap(fileMap, {
      baseBranchName: dangerBaseRef,
      branchName: dangerHeadRef,
      message: `${dangerTags} ${dangerMessage}`,
    });

    const prs = await this.githubApi.getOpenPRs({
      fromBranch: dangerHeadRef,
      toBranch: dangerBaseRef,
    });

    if (prs.length > 1) {
      warn("Couldn't find the correct pull request. Too many open ones.");
      return null;
    }

    if (prs.length === 1) {
      return prs[0];
    }

    return this.githubApi.openPR({
      fromBranch: dangerHeadRef,
      toBranch: dangerBaseRef,
      title: `${dangerTags} ${dangerMessage} to #${this.pullRequest.number}`,
      body: `${dangerMessage} to #${this.pullRequest.number}`,
    });
  }

  private parseTagsFromLine(line: string): ParsingResult {
    const result: ParsingResult = {
      type: ChangelogEntryType.NOT_INCLUDED,
      packageName: DEFAULT_CHANGELOG_ENTRY_KEY,
    };

    const tags = line.match(/\[[^\]]*\]/g)?.map(tag => tag.slice(1, tag.length - 1));
    if (!tags) {
      return result;
    }

    for (const tag of tags) {
      const entryType = parseEntryType(tag);
      if (entryType !== null) {
        result.type = Math.max(result.type, entryType);
      } else if (isExpoPackage(tag)) {
        result.packageName = tag.trim();
      }
    }

    return result;
  }
}

export function createPullRequestManager(api: Octokit, pr: PullRequest): PullRequestManager {
  return new PullRequestManager(
    pr,
    new GithubApiWrapper(api, pr.base.user.login, pr.base.repo.name)
  );
}

function parseEntryType(tag: string): ChangelogEntryType | null {
  switch (true) {
    case /\b(break(ing)?)\b/i.test(tag):
      return ChangelogEntryType.BREAKING_CHANGES;
    case /\b(feat|features?)\b/i.test(tag):
      return ChangelogEntryType.NEW_FEATURES;
    case /\b(bug|fix|bugfix|bug-fix)\b/i.test(tag):
      return ChangelogEntryType.BUG_FIXES;
    case /\b(skip)\b/i.test(tag):
      return ChangelogEntryType.SKIP;
  }
  return null;
}

function isExpoPackage(name: string): boolean {
  const prefixes = ['expo', 'unimodules'];
  return prefixes.some(prefix => name.startsWith(prefix));
}
