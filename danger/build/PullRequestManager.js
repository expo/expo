"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GithubApiWrapper_1 = require("./GithubApiWrapper");
const Utils_1 = require("./Utils");
var ChangelogEntryType;
(function (ChangelogEntryType) {
    ChangelogEntryType["BUG_FIXES"] = "bug-fix";
    ChangelogEntryType["NEW_FEATURES"] = "new-feature";
    ChangelogEntryType["BREAKING_CHANGES"] = "breaking-change";
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
     * Get suggested changelog entries from PR provided in the constructor.
     *
     * If PR doesn't contais `# Changelog` section, this method returns:
     * {
     *   [DEFAULT_CHANGELOG_ENTRY_KEY]: <title of this pr without tags>
     * }
     * Otherwise, it tries to parse PR's body.
     */
    parseChangelogSuggestionFromDescription() {
        var _a, _b;
        const changelogEntries = {
            [exports.DEFAULT_CHANGELOG_ENTRY_KEY]: {
                type: exports.DEFAULT_ENTRY_TYPE,
                message: this.pullRequest.title.replace(/\[.*\]/, '').trim(),
            },
        };
        const changelogTag = (_b = (_a = this.pullRequest.body
            .match(/#\schangelog(([^#]*?)\s?)*/i)) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.replace(/^-/, '');
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
    async createOrUpdateRPAsync(missingEntries) {
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
        const result = {
            type: exports.DEFAULT_ENTRY_TYPE,
            packageName: exports.DEFAULT_CHANGELOG_ENTRY_KEY,
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
exports.PullRequestManager = PullRequestManager;
function createPullRequestManager(api, pr) {
    return new PullRequestManager(pr, new GithubApiWrapper_1.GithubApiWrapper(api, pr.base.user.login, pr.base.repo.name));
}
exports.createPullRequestManager = createPullRequestManager;
//# sourceMappingURL=PullRequestManager.js.map