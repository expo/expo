"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPullRequestManager = exports.PullRequestManager = exports.DEFAULT_CHANGELOG_ENTRY_KEY = exports.ChangelogEntryType = void 0;
const GithubApiWrapper_1 = require("./GithubApiWrapper");
const Utils_1 = require("./Utils");
var ChangelogEntryType;
(function (ChangelogEntryType) {
    ChangelogEntryType[ChangelogEntryType["BUG_FIXES"] = 0] = "BUG_FIXES";
    ChangelogEntryType[ChangelogEntryType["NEW_FEATURES"] = 1] = "NEW_FEATURES";
    ChangelogEntryType[ChangelogEntryType["BREAKING_CHANGES"] = 2] = "BREAKING_CHANGES";
})(ChangelogEntryType = exports.ChangelogEntryType || (exports.ChangelogEntryType = {}));
exports.DEFAULT_CHANGELOG_ENTRY_KEY = 'default';
const dangerMessage = `Add missing changelog`;
const dangerTags = `[danger][bot]`;
class PullRequestManager {
    constructor(pullRequest, githubApi) {
        this.githubApi = githubApi;
        this._shouldGeneratePR = false;
        this.changelogSection = [];
        this.prHeadRef = pullRequest.head.ref;
        this.prNumber = pullRequest.number;
        this.prTitle = pullRequest.title;
        this.preprocessPR(pullRequest);
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
    parseChangelogSuggestionFromDescription() {
        const changelogEntries = {
            [exports.DEFAULT_CHANGELOG_ENTRY_KEY]: {
                type: ChangelogEntryType.BUG_FIXES,
                message: this.prTitle.replace(/\[[^\]]*\]/g, '').trim(),
            },
        };
        this.changelogSection.forEach(line => {
            const { packageName, type } = this.parseTagsFromLine(line);
            const message = line.replace(/\[.*\]/, '').trim();
            // we skip entries without message
            if (!message.length) {
                return;
            }
            changelogEntries[packageName] = {
                type,
                message,
            };
        });
        return changelogEntries;
    }
    preprocessPR(pullRequest) {
        const changelogSection = pullRequest.body.match(/#\schangelog(([^#]*?)\s?)*/i)?.[0];
        if (changelogSection) {
            this.changelogSection = changelogSection
                .split('\n')
                .slice(1)
                .map(line => line.replace(/^\s*-/, '').trim())
                .filter(line => line.length);
            // we only generate PR when the changelog section isn't empty.
            if (this.changelogSection.length) {
                this._shouldGeneratePR = true;
            }
        }
    }
    async createOrUpdatePRAsync(missingEntries) {
        const dangerHeadRef = `@danger/add-missing-changelog-to-${this.prNumber}`;
        const fileMap = missingEntries.reduce((prev, current) => ({
            ...prev,
            [Utils_1.getPackageChangelogRelativePath(current.packageName)]: current.content,
        }), {});
        await this.githubApi.createOrUpdateBranchFromFileMap(fileMap, {
            baseBranchName: this.prHeadRef,
            branchName: dangerHeadRef,
            message: `${dangerTags} ${dangerMessage}`,
        });
        const prs = await this.githubApi.getOpenPRs({
            fromBranch: dangerHeadRef,
            toBranch: this.prHeadRef,
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
            toBranch: this.prHeadRef,
            title: `${dangerTags} ${dangerMessage} to #${this.prNumber}`,
            body: `${dangerMessage} to #${this.prNumber}`,
        });
    }
    parseTagsFromLine(line) {
        const result = {
            type: ChangelogEntryType.BUG_FIXES,
            packageName: exports.DEFAULT_CHANGELOG_ENTRY_KEY,
        };
        const tags = line.match(/\[[^\]]*\]/g)?.map(tag => tag.slice(1, tag.length - 1));
        if (!tags) {
            return result;
        }
        for (const tag of tags) {
            const entryType = parseEntryType(tag);
            if (entryType !== null) {
                result.type = Math.max(result.type, entryType);
            }
            else if (isExpoPackage(tag)) {
                result.packageName = tag.trim();
            }
        }
        return result;
    }
}
exports.PullRequestManager = PullRequestManager;
function createPullRequestManager(api, pr) {
    return new PullRequestManager(pr, new GithubApiWrapper_1.GithubApiWrapper(api, pr.base.user.login, pr.base.repo.name));
}
exports.createPullRequestManager = createPullRequestManager;
function parseEntryType(tag) {
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
function isExpoPackage(name) {
    const prefixes = ['expo', 'unimodules'];
    return prefixes.some(prefix => name.startsWith(prefix));
}
//# sourceMappingURL=PullRequestManager.js.map