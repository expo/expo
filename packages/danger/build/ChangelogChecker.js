"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkChangelog = void 0;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const fs = __importStar(require("fs"));
const lodash_1 = require("lodash");
const path = __importStar(require("path"));
const PullRequestManager_1 = require("./PullRequestManager");
const Utils_1 = require("./Utils");
// Setup
const pr = danger.github.pr;
const prAuthor = pr.user.login;
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
        await spawn_async_1.default(path.join(Utils_1.getExpoRepositoryRootDir(), 'bin', 'expotools'), [
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
    fail(`📋 **Missing Changelog**
------
🛠 Add missing entries to:
${message}`);
    markdown(`### 🛠 Suggested fixes:

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
    console.log('🔎 Searching for packages without changelog...');
    const packagesWithoutChangelog = Object.entries(modifiedPackages)
        .filter(([packageName, files]) => !isChangelogModified(packageName, files))
        .map(([packageName]) => packageName);
    if (packagesWithoutChangelog.length === 0) {
        console.log('Everything is ok 🎉');
        return;
    }
    // gets suggested entries based on pull request
    console.log('📝 Gathering information from PR...');
    const suggestedEntries = getSuggestedChangelogEntries(packagesWithoutChangelog);
    // everything is up-to-date or skipped
    if (!suggestedEntries.length) {
        console.log('Everything is ok 🎉');
        return;
    }
    console.log('🛠 Suggested fixes:');
    suggestedEntries.forEach(entry => console.log(`  > ${entry.packageName} - [${PullRequestManager_1.ChangelogEntryType[entry.type]}] ${entry.message}`));
    // applies suggested fixes using `et add-changelog` command
    console.log('⚙️ Fixing...');
    const fixedEntries = await runAddChangelogCommandAsync(suggestedEntries);
    // creates/updates PR form result of `et` command - it will be merged to the current PR
    let prUrl;
    if (pullRequestManager.shouldGeneratePR()) {
        console.log('📩 Creating PR...');
        try {
            prUrl = ((await pullRequestManager.createOrUpdatePRAsync(fixedEntries)) || {}).html_url;
        }
        catch (e) {
            console.log("❌ Couldn't create a pull request.");
            console.log(e);
        }
    }
    // generates danger report. It will contain result of `et` command as a git diff and link to created PR
    console.log('📋 Creating report...');
    await generateReport(fixedEntries, prUrl);
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