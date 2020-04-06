import './DangerDeclarations';
import * as fs from 'fs';
import { groupBy } from 'lodash';
import * as path from 'path';
import spawnAsync from '@expo/spawn-async';

import { createPullRequestManager, ChangelogEntry } from './PullRequestManager';
import {
  getExpoRepositoryRootDir,
  getFileContentAsync,
  getPackageChangelogRelativePath,
} from './Utils';

export type PackageChangelogEntry = ChangelogEntry & {
  packageName: string;
};

export type FixedChangelogEntry = PackageChangelogEntry & { content: string; diff: string };

// Setup
const pr = danger.github.pr;
const prAuthor = pr.base.user.login;
const pullRequestManager = createPullRequestManager(danger.github.api, pr);

async function getFileDiffAsync(path): Promise<string> {
  const { stdout } = await spawnAsync('git', ['diff', '--', path], {
    cwd: getExpoRepositoryRootDir(),
  });
  return stdout;
}

/**
 * @returns `false` if `CHANGELOG.md` doesn't exist in provided package.
 */
function isChangelogModified(packageName: string, modifiedFiles: string[]): boolean {
  const changelogPath = getPackageChangelogRelativePath(packageName);

  return (
    modifiedFiles.includes(changelogPath) ||
    !fs.existsSync(path.join(getExpoRepositoryRootDir(), changelogPath))
  );
}

function getSuggestedChangelogEntries(packageNames: string[]): PackageChangelogEntry[] {
  const {
    DEFAULT_CHANGELOG_ENTRY_KEY: defaultEntry,
    ...suggestedEntries
  } = pullRequestManager.parseChangelogSuggestionFromDescription();

  return packageNames.map(packageName => {
    const message = suggestedEntries[packageName]?.message ?? defaultEntry.message;
    const type = suggestedEntries[packageName]?.type ?? defaultEntry.type;
    return {
      packageName,
      message,
      type,
    };
  });
}

async function runAddChangelogCommandAsync(
  suggestedEntries: PackageChangelogEntry[]
): Promise<FixedChangelogEntry[]> {
  await Promise.all(
    suggestedEntries.map(entry =>
      spawnAsync('et', [
        `add-changelog`,
        `--package`,
        entry.packageName,
        `--entry`,
        entry.message,
        `--author`,
        prAuthor,
        `--type`,
        entry.type,
        `--pull-request`,
        `${pr.number}`,
      ])
    )
  );

  return Promise.all(
    suggestedEntries.map(async entry => {
      const changelogPath = path.join(
        getExpoRepositoryRootDir(),
        getPackageChangelogRelativePath(entry.packageName)
      );
      return {
        ...entry,
        content: await getFileContentAsync(changelogPath),
        diff: await getFileDiffAsync(changelogPath),
      };
    })
  );
}

function generateReport(
  missingEntries: Array<{ packageName: string; diff: string }>,
  url?: string | null
) {
  const message = missingEntries
    .map(
      entry =>
        `- <code>${danger.github.utils.fileLinks(
          [getPackageChangelogRelativePath(entry.packageName)],
          false
        )}</code>`
    )
    .join('\n');

  const diff = '```diff\n' + missingEntries.map(entry => entry.diff).join('\n') + '```\n';
  const pr = url ? `#### or merge this pull request: ${url}` : '';
  fail(`
📋 **Missing Changelog**
------
🛠 Add missing entires to:
${message}`);

  markdown(
    `
### 🛠 Suggested fixes:

<details>
  <summary>📋 Missing changelog</summary>

  #### Apply suggested changes:
${diff}
${pr} 
</details>`
  );
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
export async function checkChangelog(): Promise<void> {
  const modifiedPackages = groupBy(
    danger.git.modified_files.filter(file => file.startsWith('packages')),
    file => file.split(path.sep)[1]
  );

  const packagesWithoutChangelog = Object.entries(modifiedPackages)
    .filter(([packageName, files]) => !isChangelogModified(packageName, files))
    .map(([packageName, _]) => packageName);
  if (packagesWithoutChangelog.length === 0) {
    message(`✅ **Changelog**`);
    return;
  }

  // gets suggested entries based on pull request
  const suggestedEntries = getSuggestedChangelogEntries(packagesWithoutChangelog);

  // applies suggested fixes using `et add-changelog` command
  const fixedEntries = await runAddChangelogCommandAsync(suggestedEntries);

  // creates/updates PR form result of `et` command - it will be merged to the current PR
  const { html_url } = (await pullRequestManager.createOrUpdateRPAsync(fixedEntries)) || {};

  // generates danger report. It will contain result of `et` command as a git diff and link to created PR
  await generateReport(fixedEntries, html_url);
}
