import { Octokit } from '@octokit/rest';
import { GitHubPRDSL } from 'danger/distribution/dsl/GitHubDSL';
import { GithubApiWrapper } from './GithubApiWrapper';
export declare enum ChangelogEntryType {
    BUG_FIXES = 0,
    NEW_FEATURES = 1,
    BREAKING_CHANGES = 2
}
export declare type ChangelogEntry = {
    type: ChangelogEntryType;
    message: string;
};
export declare const DEFAULT_CHANGELOG_ENTRY_KEY: "default";
export declare type ChangelogEntries = {
    [DEFAULT_CHANGELOG_ENTRY_KEY]: ChangelogEntry;
    [key: string]: ChangelogEntry;
};
export declare type PullRequest = GitHubPRDSL | Octokit.PullsListResponseItem;
export declare class PullRequestManager {
    private githubApi;
    private _shouldGeneratePR;
    private changelogSection;
    private prTitle;
    private prHeadRef;
    private prNumber;
    constructor(pullRequest: PullRequest, githubApi: GithubApiWrapper);
    shouldGeneratePR(): boolean;
    /**
     * Gets suggested changelog entries from PR provided in the constructor.
     *
     * If PR doesn't contain `# Changelog` section, this method returns:
     * {
     *   [DEFAULT_CHANGELOG_ENTRY_KEY]: <title of this pr without tags>
     * }
     * Otherwise, it tries to parse PR's body.
     */
    parseChangelogSuggestionFromDescription(): ChangelogEntries;
    private preprocessPR;
    createOrUpdatePRAsync(missingEntries: {
        packageName: string;
        content: string;
    }[]): Promise<PullRequest | null>;
    private parseTagsFromLine;
}
export declare function createPullRequestManager(api: Octokit, pr: PullRequest): PullRequestManager;
