"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const fs = __importStar(require("fs"));
const lodash_1 = require("lodash");
const path = __importStar(require("path"));
const PullRequestManager_1 = require("./PullRequestManager");
const Utils_1 = require("./Utils");
// Setup
const pr = danger.github.pr;
const prAuthor = pr.base.user.login;
const pullRequestManager = PullRequestManager_1.createPullRequestManager(danger.github.api, pr);
async function getFileDiffAsync(path) {
    const { stdout } = await spawn_async_1.default('git', ['diff', '--', path], {
        cwd: Utils_1.getExpoRepositoryRootDir(),
    });
    return stdout;
}
/**
 * @returns `false` if `CHANGELOG.md` doesn't exist in provided package.
 */
function isChangelogModified(packageName, modifiedFiles) {
    const changelogPath = Utils_1.getPackageChangelogRelativePath(packageName);
    return (modifiedFiles.includes(changelogPath) ||
        !fs.existsSync(path.join(Utils_1.getExpoRepositoryRootDir(), changelogPath)));
}
function getSuggestedChangelogEntries(packageNames) {
    const { [PullRequestManager_1.DEFAULT_CHANGELOG_ENTRY_KEY]: defaultEntry, ...suggestedEntries } = pullRequestManager.parseChangelogSuggestionFromDescription();
    return packageNames.map(packageName => {
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
async function runAddChangelogCommandAsync(suggestedEntries) {
    for (const entry of suggestedEntries) {
        await spawn_async_1.default('et', [
            `add-changelog`,
            `--package`,
            entry.packageName,
            `--entry`,
            entry.message,
            `--author`,
            prAuthor,
            `--type`,
            entryTypeToString(entry.type),
            `--pull-request`,
            `${pr.number}`,
        ]);
    }
    return Promise.all(suggestedEntries.map(async (entry) => {
        const changelogPath = path.join(Utils_1.getExpoRepositoryRootDir(), Utils_1.getPackageChangelogRelativePath(entry.packageName));
        return {
            ...entry,
            content: await Utils_1.getFileContentAsync(changelogPath),
            diff: await getFileDiffAsync(changelogPath),
        };
    }));
}
function generateReport(missingEntries, url) {
    const message = missingEntries
        .map(entry => `- <code>${danger.github.utils.fileLinks([Utils_1.getPackageChangelogRelativePath(entry.packageName)], false)}</code>`)
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
/**
 * This function checks if the changelog was modified, doing the following steps:
 * - get packages which were modified but don't have changes in `CHANGELOG.md`
 * - parse PR body to get suggested entries for those packages
 * - run `et add-changelog` for each package to apply the suggestion
 * - create a new PR
 * - add a comment to inform about missing changelog
 * - fail CI job
 */
async function checkChangelog() {
    const modifiedPackages = lodash_1.groupBy(danger.git.modified_files.filter(file => file.startsWith('packages')), file => file.split(path.sep)[1]);
    const packagesWithoutChangelog = Object.entries(modifiedPackages)
        .filter(([packageName, files]) => !isChangelogModified(packageName, files))
        .map(([packageName]) => packageName);
    if (packagesWithoutChangelog.length === 0) {
        message(`✅ **Changelog**`);
        return;
    }
    // gets suggested entries based on pull request
    const suggestedEntries = getSuggestedChangelogEntries(packagesWithoutChangelog);
    // applies suggested fixes using `et add-changelog` command
    const fixedEntries = await runAddChangelogCommandAsync(suggestedEntries);
    // creates/updates PR form result of `et` command - it will be merged to the current PR
    const { html_url } = (await pullRequestManager.createOrUpdatePRAsync(fixedEntries)) || {};
    // generates danger report. It will contain result of `et` command as a git diff and link to created PR
    await generateReport(fixedEntries, html_url);
}
exports.checkChangelog = checkChangelog;
function entryTypeToString(type) {
    switch (type) {
        case PullRequestManager_1.ChangelogEntryType.BUG_FIXES:
            return 'bug-fix';
        case PullRequestManager_1.ChangelogEntryType.NEW_FEATURES:
            return 'new-feature';
        case PullRequestManager_1.ChangelogEntryType.BREAKING_CHANGES:
            return 'breaking-change';
    }
    throw new Error(`Unknown entry type ${type}.`);
}
//# sourceMappingURL=ChangelogChecker.js.map