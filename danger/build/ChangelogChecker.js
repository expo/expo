"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const lodash_1 = require("lodash");
const path = __importStar(require("path"));
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const GithubWrapper_1 = require("./GithubWrapper");
const Utils_1 = require("./Utils");
const DEFAULT_CHANGELOG_ENTRY_KEY = 'default';
var ChangelogEntryType;
(function (ChangelogEntryType) {
    ChangelogEntryType["BUG_FIXES"] = "bug-fix";
    ChangelogEntryType["NEW_FEATURES"] = "new-feature";
    ChangelogEntryType["BREAKING_CHANGES"] = "breaking-change";
})(ChangelogEntryType || (ChangelogEntryType = {}));
const DEFAULT_ENTRY_TYPE = ChangelogEntryType.BUG_FIXES;
// Setup
const pr = danger.github.pr;
const modifiedFiles = danger.git.modified_files;
const prAuthor = pr.base.user.login;
const github = new GithubWrapper_1.GithubWrapper(danger.github.api, prAuthor, pr.base.repo.name);
/**
 * @param packageName for example: `expo-image-picker` or `unimodules-constatns-interface`
 * @returns relative path to package's changelog. For example: `packages/expo-image-picker/CHANGELOG.md`
 */
function getPackageChangelogPath(packageName) {
    return path.join('packages', packageName, 'CHANGELOG.md');
}
async function getFileContentAsync(path) {
    const buffer = await fs.promises.readFile(path);
    return buffer.toString();
}
async function getFileDiffAsync(path) {
    const { stdout } = await spawn_async_1.default('git', ['diff', '--', path], {
        cwd: Utils_1.getExpoRepositoryRootDir(),
    });
    return stdout;
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
 * If PR doesn't contais `# Changelog` section, this method returns:
 * {
 *   [DEFAULT_CHANGELOG_ENTRY_KEY]: <title of this pr without tags>
 * }
 * Otherwise, it tries to parse PR's body.
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
 * If `CHANGELOG.md` doesn't exist in provided package, it returns false.
 */
function wasChangelogModified(packageName, modifiedFiles) {
    const changelogPath = getPackageChangelogPath(packageName);
    return (modifiedFiles.includes(changelogPath) ||
        !fs.existsSync(path.join(Utils_1.getExpoRepositoryRootDir(), changelogPath)));
}
function getPackagesWithoutChangelogEntry(modifiedPackages) {
    return Object.keys(modifiedPackages).filter(packageName => !wasChangelogModified(packageName, modifiedPackages[packageName]));
}
function getSuggestedChangelogEntries(packagesWithoutChangelogEntry) {
    const { DEFAULT_CHANGELOG_ENTRY_KEY: defaultEntry, ...suggestedEntries } = getChangelogSuggestionFromPR();
    return packagesWithoutChangelogEntry.map(packageName => {
        var _a, _b, _c, _d;
        const message = (_b = (_a = suggestedEntries[packageName]) === null || _a === void 0 ? void 0 : _a.message) !== null && _b !== void 0 ? _b : defaultEntry.message;
        const type = (_d = (_c = suggestedEntries[packageName]) === null || _c === void 0 ? void 0 : _c.type) !== null && _d !== void 0 ? _d : defaultEntry.type;
        return {
            packageName,
            message,
            type,
        };
    });
}
async function runAddChangelogCommand(suggestedEntries) {
    await Promise.all(suggestedEntries.map(entry => spawn_async_1.default('et', [
        `add-changelog`,
        `--package`,
        entry.packageName,
        `--entry`,
        entry.message,
        `--author`,
        prAuthor,
        `--type`,
        entry.type,
        `--pullRequest`,
        `${pr.number}`,
    ])));
    return Promise.all(suggestedEntries.map(async (entry) => {
        const changelogPath = path.join(Utils_1.getExpoRepositoryRootDir(), getPackageChangelogPath(entry.packageName));
        return {
            ...entry,
            content: await getFileContentAsync(changelogPath),
            diff: await getFileDiffAsync(changelogPath),
        };
    }));
}
// @ts-ignore
async function createOrUpdateRP(missingEntries) {
    const dangerHeadRef = `@danger/add-missing-changelog-to-${pr.number}`;
    const dangerBaseRef = pr.head.ref;
    const dangerMessage = `Add missing changelog`;
    const dangerTags = `[danger][bot]`;
    const fileMap = missingEntries.reduce((prev, current) => ({
        ...prev,
        [getPackageChangelogPath(current.packageName)]: current.content,
    }), {});
    await github.createOrUpdateBranchFromFileMap(fileMap, {
        baseBranchName: dangerBaseRef,
        branchName: dangerHeadRef,
        message: `${dangerTags} ${dangerMessage}`,
    });
    const prs = await github.getOpenPR({
        fromBranch: dangerHeadRef,
        toBranch: dangerBaseRef,
    });
    if (prs.length > 1) {
        warn("Couldn't find a correct pull request. Too many open ones.");
        return null;
    }
    if (prs.length === 1) {
        return prs[0].html_url;
    }
    const { html_url } = await github.openPR({
        fromBranch: dangerHeadRef,
        toBranch: dangerBaseRef,
        title: `${dangerTags} ${dangerMessage} to #${pr.number}`,
        body: `${dangerMessage} to #${pr.number}`,
    });
    return html_url;
}
// @ts-ignore
function generateReport(missingEntries, url) {
    const message = missingEntries
        .map(entry => `- <code>${danger.github.utils.fileLinks([getPackageChangelogPath(entry.packageName)], false)}</code>`)
        .join('\n');
    const diff = '```diff\n' + missingEntries.map(entry => entry.diff).join('\n') + '```\n';
    const pr = url ? `#### or merge this pull request: ${url}` : '';
    fail(`
📋 **Missing Changelog**
------
🛠 Add missing entires to:
${message}`);
    markdown(`
### 🛠 Suggested fixes:

<details>
  <summary>📋 Missing changelog</summary>

  #### Apply suggested changes:
${diff}
${pr} 
</details>`);
}
async function changelogCheck() {
    const modifiedPackages = lodash_1.groupBy(modifiedFiles.filter(file => file.startsWith('packages')), file => file.split(path.sep)[1]);
    const packagesWithoutChangelogEntry = getPackagesWithoutChangelogEntry(modifiedPackages);
    if (packagesWithoutChangelogEntry.length === 0) {
        message(`✅ **Changelog**`);
        return;
    }
    const suggestedEntries = getSuggestedChangelogEntries(packagesWithoutChangelogEntry);
    const fixedEntries = await runAddChangelogCommand(suggestedEntries);
    const url = await createOrUpdateRP(fixedEntries);
    await generateReport(fixedEntries, url);
}
exports.changelogCheck = changelogCheck;
//# sourceMappingURL=ChangelogChecker.js.map