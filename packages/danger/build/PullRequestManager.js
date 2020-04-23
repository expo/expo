"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GithubApiWrapper_1 = require("./GithubApiWrapper");
const Utils_1 = require("./Utils");
var ChangelogEntryType;
(function (ChangelogEntryType) {
    ChangelogEntryType[ChangelogEntryType["BUG_FIXES"] = 0] = "BUG_FIXES";
    ChangelogEntryType[ChangelogEntryType["NEW_FEATURES"] = 1] = "NEW_FEATURES";
    ChangelogEntryType[ChangelogEntryType["BREAKING_CHANGES"] = 2] = "BREAKING_CHANGES";
})(ChangelogEntryType = exports.ChangelogEntryType || (exports.ChangelogEntryType = {}));
exports.DEFAULT_ENTRY_TYPE = ChangelogEntryType.BUG_FIXES;
exports.DEFAULT_CHANGELOG_ENTRY_KEY = 'default';
const dangerMessage = `Add missing changelog`;
const dangerTags = `[danger][bot]`;
class PullRequestManager {
    constructor(pullRequest, githubApi) {
        this.pullRequest = pullRequest;
        this.githubApi = githubApi;
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
        var _a;
        const changelogEntries = {
            [exports.DEFAULT_CHANGELOG_ENTRY_KEY]: {
                type: exports.DEFAULT_ENTRY_TYPE,
                message: this.pullRequest.title.replace(/\[.*\]/, '').trim(),
            },
        };
        const parseLine = line => {
            const parsingResult = this.parseTagsFromLine(line);
            changelogEntries[parsingResult.packageName] = {
                type: parsingResult.type,
                message: line.replace(/\[.*\]/, '').trim(),
            };
        };
        parseLine(this.pullRequest.title);
        const changelogSection = (_a = this.pullRequest.body.match(/#\schangelog(([^#]*?)\s?)*/i)) === null || _a === void 0 ? void 0 : _a[0];
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
    async createOrUpdatePRAsync(missingEntries) {
        const dangerHeadRef = `@danger/add-missing-changelog-to-${this.pullRequest.number}`;
        const dangerBaseRef = this.pullRequest.head.ref;
        const fileMap = missingEntries.reduce((prev, current) => ({
            ...prev,
            [Utils_1.getPackageChangelogRelativePath(current.packageName)]: current.content,
        }), {});
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
    parseTagsFromLine(line) {
        var _a;
        const result = {
            type: exports.DEFAULT_ENTRY_TYPE,
            packageName: exports.DEFAULT_CHANGELOG_ENTRY_KEY,
        };
        const tags = (_a = line.match(/\[[^\]]*\]/g)) === null || _a === void 0 ? void 0 : _a.map(tag => tag.slice(1, tag.length - 1));
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