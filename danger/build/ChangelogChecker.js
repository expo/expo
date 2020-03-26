"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const lodash_1 = require("lodash");
const path = __importStar(require("path"));
const GithubWrapper_1 = require("./GithubWrapper");
const Utils_1 = require("./Utils");
const DEFAULT_CHANGELOG_ENTRY_KEY = 'default';
var ChangelogEntryType;
(function (ChangelogEntryType) {
    ChangelogEntryType["BUG_FIXES"] = "\uD83D\uDC1B Bug fixes";
    ChangelogEntryType["NEW_FEATURES"] = "\uD83C\uDF89 New features";
    ChangelogEntryType["BREAKING_CHANGES"] = "\uD83D\uDEE0 Breaking changes";
})(ChangelogEntryType || (ChangelogEntryType = {}));
const DEFAULT_ENTRY_TYPE = ChangelogEntryType.BUG_FIXES;
// Setup
const pr = danger.github.pr;
const modifiedFiles = danger.git.modified_files;
const github = new GithubWrapper_1.GithubWrapper(danger.github.api, pr.base.user.login, pr.base.repo.name);
/**
 * @param packageName for example: `expo-image-picker` or `unimodules-constatns-interface`
 * @returns relatice path to package. For example: `packages/expo-image-picker/CHANGELOG.md`
 */
function getPackageChangelogPath(packageName) {
    return path.join('packages', packageName, 'CHANGELOG.md');
}
function getTags(entry) {
    const result = {
        type: DEFAULT_ENTRY_TYPE,
        packageName: DEFAULT_CHANGELOG_ENTRY_KEY,
    };
    const tags = entry.match(/\[[^\]]*\]/g);
    if (!tags) {
        return result;
    }
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
/**
 * Get suggested changelog entries from PR.
 *
 * If PR doesn't contais `# Changelog` section then this method returns:
 * {
 *   [DEFAULT_CHANGELOG_ENTRY_KEY]: <title of this pr without tags>
 * }
 * Otherwise it tries to parse PR's body.
 */
function getChangelogSuggestionFromPR() {
    var _a, _b;
    const changelogEntries = {
        [DEFAULT_CHANGELOG_ENTRY_KEY]: {
            type: DEFAULT_ENTRY_TYPE,
            message: pr.title.replace(/\[.*\]/, '').trim(),
        },
    };
    const changelogTag = (_b = (_a = pr.body.match(/#\schangelog(([^#]*?)\s?)*/i)) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.replace(/^-/, '');
    if (changelogTag) {
        changelogTag
            .split('\n')
            .slice(1)
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .forEach(line => {
            const tags = getTags(line);
            console.log({ tags });
            if (!tags) {
                warn(`Cound't parse tags from PR's body. Line: ${line}.`);
                return;
            }
            if (tags.packageName) {
                changelogEntries[tags.packageName] = {
                    type: tags.type,
                    message: line.replace(/\[.*\]/, '').trim(),
                };
            }
        });
    }
    return changelogEntries;
}
/**
 * Check if the changelog was modified.
 * If `CHANGELOG.md` doesn't exist in provided package, it retunrs false.
 */
function wasChangelogModified(packageName, modifiedFiles) {
    const changelogPath = getPackageChangelogPath(packageName);
    return (modifiedFiles.includes(changelogPath) ||
        !fs.existsSync(path.join(Utils_1.getExpoRepositoryRootDir(), changelogPath)));
}
/**
 * Add additional information, like PRs author and PRs link, to the entry.
 */
function addPRInfoToChangelogEntry(entry) {
    // We need to escape link in that way to display them in their raw form.
    return `\\- ${entry} (\\[#<span/>${pr.number}](https:<span/>//github.com/expo/expo/pull/<span/>${pr.number}) by \\[@<span/>${pr.user.login}](https:<span/>//github.com/${pr.user.login}))`;
}
function getPackagesWithoutChangelogEntry(modifiedPackages) {
    return Object.keys(modifiedPackages).filter(packageName => !wasChangelogModified(packageName, modifiedPackages[packageName]));
}
function getSuggestedChangelogEntries(packagesWithoutChangelogEntry) {
    const { DEFAULT_CHANGELOG_ENTRY_KEY: defaultEntry, ...suggestedEntries } = getChangelogSuggestionFromPR();
    return packagesWithoutChangelogEntry.map(packageName => {
        var _a, _b, _c, _d;
        const message = addPRInfoToChangelogEntry((_b = (_a = suggestedEntries[packageName]) === null || _a === void 0 ? void 0 : _a.message) !== null && _b !== void 0 ? _b : defaultEntry.message);
        const type = (_d = (_c = suggestedEntries[packageName]) === null || _c === void 0 ? void 0 : _c.type) !== null && _d !== void 0 ? _d : defaultEntry.type;
        return {
            packageName,
            message,
            type,
        };
    });
}
// @ts-ignore
async function createOrUpdateRP(missingEntries) {
    const dangerHeadRef = `@danger/add-missing-changelog-to-${pr.number}`;
    const dangerBaseRef = pr.head.ref;
    const dangerMessage = `Add missing changelog to #${pr.number}`;
    const dangerTags = `[danger][bot]`;
    const prs = await github.getOpenPR({
        fromBranch: dangerHeadRef,
        toBranch: dangerBaseRef,
    });
    console.log(prs);
    if (prs.length > 1) {
        warn("Couldn't find a correct pull request. Too many open ones.");
        return;
    }
    if (prs.length === 1) {
        // const dangerPR = prs[0];
        // todo: check if this pr is up to date
        return;
    }
    const fileMap = {
        'test.md': `# Simple md`,
    };
    await github.createOrUpdateBranchFromFileMap(fileMap, {
        baseBranchName: dangerBaseRef,
        branchName: dangerHeadRef,
        message: `${dangerTags} ${dangerMessage}`,
    });
    await github.openPR({
        fromBranch: dangerHeadRef,
        toBranch: dangerBaseRef,
        title: `${dangerTags} ${dangerMessage}`,
        body: dangerMessage,
    });
}
function generateReport(missingEntries) {
    const message = missingEntries
        .map(missingEntry => `
- <code>${danger.github.utils.fileLinks([getPackageChangelogPath(missingEntry.packageName)], false)}</code>

Suggested entry:
> _${missingEntry.message}_`)
        .join('');
    fail(`
📋 **Missing Changelog**
------
### 🛠 Add missing entires to:
${message}`);
}
async function changelogCheck() {
    const modifiedPackages = lodash_1.groupBy(modifiedFiles.filter(file => file.startsWith('packages')), file => file.split(path.sep)[1]);
    const packagesWithoutChangelogEntry = getPackagesWithoutChangelogEntry(modifiedPackages);
    console.log(packagesWithoutChangelogEntry);
    if (packagesWithoutChangelogEntry.length === 0) {
        message(`✅ **Changelog**`);
        return true;
    }
    const suggestedEntries = getSuggestedChangelogEntries(packagesWithoutChangelogEntry);
    generateReport(suggestedEntries);
    console.log(suggestedEntries);
    return true;
}
exports.changelogCheck = changelogCheck;
//# sourceMappingURL=ChangelogChecker.js.map