import { GitHubPRDSL } from 'danger/distribution/dsl/GitHubDSL';

import { Octokit } from '@octokit/rest';
import { GithubApiWrapper } from './GithubApiWrapper';
import { getPackageChangelogRelativePath } from './Utils';

export enum ChangelogEntryType {
  BUG_FIXES = 'bug-fix',
  NEW_FEATURES = 'new-feature',
  BREAKING_CHANGES = 'breaking-change',
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

const dangerMessage = `Add missing changelog`;
const dangerTags = `[danger][bot]`;

export class PullRequestManager {
  constructor(private pullRequest: PullRequest, private githubApi: GithubApiWrapper) {}

  /**
   * Get suggested changelog entries from PR provided in the constructor.
   *
   * If PR doesn't contais `# Changelog` section, this method returns:
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

    const changelogTag = this.pullRequest.body
      .match(/#\schangelog(([^#]*?)\s?)*/i)?.[0]
      ?.replace(/^-/, '');
    if (changelogTag) {
      changelogTag
        .split('\n')
        .slice(1)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .forEach(line => {
          const tags = this.parseTagsFromLine(line);
          if (!tags) {
            warn(`Couldn't parse line: ${line}.`);
            return;
          }

          changelogEntries[tags.packageName] = {
            type: tags.type,
            message: line.replace(/\[.*\]/, '').trim(),
          };
        });
    }

    return changelogEntries;
  }

  async createOrUpdateRPAsync(
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

  private parseTagsFromLine(
    line: string
  ): { packageName: string | typeof DEFAULT_CHANGELOG_ENTRY_KEY; type: ChangelogEntryType } | null {
    const result: {
      packageName: string | typeof DEFAULT_CHANGELOG_ENTRY_KEY;
      type: ChangelogEntryType;
    } = {
      type: DEFAULT_ENTRY_TYPE,
      packageName: DEFAULT_CHANGELOG_ENTRY_KEY,
    };

    const tags = line.match(/\[[^\]]*\]/g);
    if (!tags) {
      return result;
    }
    // We currently support only two tags - packageName and type.
    if (tags.length > 2) {
      return null;
    }

    for (const tag of tags) {
      switch (true) {
        case /\[[\s-_]*(bug)?[\s-_]*fix[\s-_]*\]/i.test(tag):
          result.type = ChangelogEntryType.BUG_FIXES;
          break;
        case /\[[\s-_]*(new)?[\s-_]*feature(s)?[\s-_]*\]/i.test(tag):
          result.type = ChangelogEntryType.NEW_FEATURES;
          break;
        case /\[[\s-_]*breaking[\s-_]*(change)?[\s-_]*\]/i.test(tag):
          result.type = ChangelogEntryType.BREAKING_CHANGES;
          break;
        default:
          result['packageName'] = tag.replace(/\[|\]/g, '').trim();
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
