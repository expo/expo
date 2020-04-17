import { Octokit } from '@octokit/rest';
import { GitHubPRDSL } from 'danger/distribution/dsl/GitHubDSL';

import { GithubApiWrapper } from './GithubApiWrapper';
import { getPackageChangelogRelativePath } from './Utils';

export enum ChangelogEntryType {
  BUG_FIXES = 0,
  NEW_FEATURES = 1,
  BREAKING_CHANGES = 2,
}

export const DEFAULT_ENTRY_TYPE = ChangelogEntryType.BUG_FIXES;

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
  constructor(private pullRequest: PullRequest, private githubApi: GithubApiWrapper) {}

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
        type: DEFAULT_ENTRY_TYPE,
        message: this.pullRequest.title.replace(/\[.*\]/, '').trim(),
      },
    };

    const parseLine: (line: string) => void = line => {
      const parsingResult = this.parseTagsFromLine(line);
      changelogEntries[parsingResult.packageName] = {
        type: parsingResult.type,
        message: line.replace(/\[.*\]/, '').trim(),
      };
    };

    parseLine(this.pullRequest.title);

    const changelogSection = this.pullRequest.body.match(/#\schangelog(([^#]*?)\s?)*/i)?.[0];
    if (changelogSection) {
      changelogSection
        .replace(/^-/, '')
        .split('\n')
        .slice(1)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .forEach(parseLine);
    }

    return changelogEntries;
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
      type: DEFAULT_ENTRY_TYPE,
      packageName: DEFAULT_CHANGELOG_ENTRY_KEY,
    };

    const tags = line.match(/\[[^\]]*\]/g);
    if (!tags) {
      return result;
    }

    for (const tag of tags) {
      const entryType = parseEntryType(tag);
      if (entryType !== null) {
        result.type = Math.max(result.type, entryType);
      } else if (isExpoPackage(tag)) {
        result.packageName = tag.replace(/\[|\]/g, '').trim();
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
  }
  return null;
}

function isExpoPackage(name: string): boolean {
  const prefixes = ['expo', 'unimodules'];
  return prefixes.some(prefix => name.startsWith(prefix));
}
