"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPullRequestManager = exports.PullRequestManager = exports.DEFAULT_CHANGELOG_ENTRY_KEY = exports.ChangelogEntryType = void 0;
const GithubApiWrapper_1 = require("./GithubApiWrapper");
const Utils_1 = require("./Utils");
var ChangelogEntryType;
(function (ChangelogEntryType) {
    ChangelogEntryType[ChangelogEntryType["NOT_INCLUDED"] = -2] = "NOT_INCLUDED";
    ChangelogEntryType[ChangelogEntryType["SKIP"] = -1] = "SKIP";
    ChangelogEntryType[ChangelogEntryType["BUG_FIXES"] = 0] = "BUG_FIXES";
    ChangelogEntryType[ChangelogEntryType["NEW_FEATURES"] = 1] = "NEW_FEATURES";
    ChangelogEntryType[ChangelogEntryType["BREAKING_CHANGES"] = 2] = "BREAKING_CHANGES";
})(ChangelogEntryType = exports.ChangelogEntryType || (exports.ChangelogEntryType = {}));
exports.DEFAULT_CHANGELOG_ENTRY_KEY = 'default';
const dangerMessage = `Add missing changelog`;
const dangerTags = `[danger][bot]`;
class PullRequestManager {
    constructor(pullRequest, githubApi) {
        this.pullRequest = pullRequest;
        this.githubApi = githubApi;
        this._shouldGeneratePR = false;
        this.changelogSection = [];
        this.skip = false;
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
    parseChangelogSuggestionFromDescription() {
        const changelogEntries = {
            [exports.DEFAULT_CHANGELOG_ENTRY_KEY]: {
                type: this.skip ? ChangelogEntryType.SKIP : ChangelogEntryType.NOT_INCLUDED,
                message: this.pullRequest.title.replace(/\[.*\]/, '').trim(),
            },
        };
        const parseLine = line => {
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
    preprocessPR() {
        var _a;
        const changelogSection = (_a = this.pullRequest.body.match(/#\schangelog(([^#]*?)\s?)*/i)) === null || _a === void 0 ? void 0 : _a[0];
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
            type: ChangelogEntryType.NOT_INCLUDED,
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
        case /\b(skip)\b/i.test(tag):
            return ChangelogEntryType.SKIP;
    }
    return null;
}
function isExpoPackage(name) {
    const prefixes = ['expo', 'unimodules'];
    return prefixes.some(prefix => name.startsWith(prefix));
}
//# sourceMappingURL=PullRequestManager.js.map