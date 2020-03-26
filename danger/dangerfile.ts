import { danger, warn } from 'danger';
import * as fs from 'fs';
import { groupBy } from 'lodash';
import * as path from 'path';

import { GithubWrapper } from './GithubWrapper';
import { getExpoRepositoryRootDir } from './Utils';

// Setup
const pr = danger.github.pr;
const modified = danger.git.modified_files;
const DEFAULT_CHANGELOG_ENTRY_KEY = 'default';
const repo = pr.base.repo.name;
const owner = pr.base.user.login;
const github = new GithubWrapper(danger.github.api, repo, owner);

type ChangelogEntries = {
  [DEFAULT_CHANGELOG_ENTRY_KEY]: string;
  [Key: string]: string;
};

function checkChangelog() {
  function getPackageChangelogPath(packageName: string): string {
    return path.join('packages', packageName, 'CHANGELOG.md');
  }

  function getSuggestedChangelogEntiresFromPR(): ChangelogEntries {
    const changelogEntries = {
      [DEFAULT_CHANGELOG_ENTRY_KEY]: pr.title.replace(/\[.*\]/, '').trim(),
    };

    const changelogTag = pr.body.match(/#\schangelog(([^#]*?)\s?)*/i)[0].replace(/^-/, '');
    if (changelogTag) {
      changelogTag
        .split('\n')
        .slice(1)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .forEach(line => {
          const packageTag = line.match(/\[.*\]/)[0];
          if (packageTag) {
            changelogEntries[packageTag.replace(/\[|\]/g, '').trim()] = line
              .replace(/\[.*\]/, '')
              .trim();
            return;
          }

          changelogEntries[DEFAULT_CHANGELOG_ENTRY_KEY] = line;
        });
    }

    return changelogEntries;
  }

  function wasChangelogModified(packageName: string, files: string[]) {
    const changelogPath = getPackageChangelogPath(packageName);
    return (
      files.includes(changelogPath) ||
      !fs.existsSync(path.join(getExpoRepositoryRootDir(), changelogPath))
    );
  }

  function addPRInfoToChangelogEntry(entry: string) {
    return `\\- ${entry} (\\[#<span/>${pr.number}](https:<span/>//github.com/expo/expo/pull/<span/>${pr.number}) by \\[@<span/>${pr.user.login}](https:<span/>//github.com/${pr.user.login}))`;
  }

  function getPackagesWithoutChangelogEntry(modifiedPackages: {
    [Key: string]: string[];
  }): string[] {
    return Object.keys(modifiedPackages).filter(
      packageName => !wasChangelogModified(packageName, modifiedPackages[packageName])
    );
  }

  function getSuggestedChangelogEntriesForPackages(
    packagesWithoutChangelogEntry: string[]
  ): { packageName: string; entry: string }[] {
    const {
      DEFAULT_CHANGELOG_ENTRY_KEY: defaultEntry,
      ...suggestedEntries
    } = getSuggestedChangelogEntiresFromPR();

    return packagesWithoutChangelogEntry.map(packageName => {
      const entry = addPRInfoToChangelogEntry(suggestedEntries[packageName] ?? defaultEntry);
      return {
        packageName,
        entry,
      };
    });
  }

  async function createOrUpdateRP(missingEntries: { packageName: string; entry: string }[]) {
    const dangerPRHead = `@danger/add-missing-changelog-to-${pr.number}`;

    const { data: prs } = await danger.github.api.pulls.list({
      repo,
      owner,
      state: 'open',
      base: pr.head.ref,
      head: dangerPRHead,
    });

    if (prs.length > 1) {
      warn("Couldn't find a correct pull request. Too many open ones.");
      return;
    }

    if (prs.length === 1) {
      const dangerPR = prs[0];
      // todo: check if this pr is up to date

      return;
    }

    const fileMap = {
      'test.md': `# Simple md`,
    };

    await github.createOrUpdateBranchFromFileMap(fileMap, {
      baseBranchRef: 'heads/' + pr.head.ref,
      branchRef: `heads/${dangerPRHead}`,
      message: 'Update changelog',
    });

    danger.github.api.pulls.create({
      repo,
      owner,
      base: pr.head.ref,
      head: dangerPRHead,
      title: `[danger][bot] Add missing changelog to #${pr.number}`,
      body: `Add missing changelog to #${pr.number}`,
    });
    // console.log(prs[0]);
    // pr not existing, so we need to creat it
    // if (!pr) {
    //
    // }
  }

  function generateReport(missingEntries: { packageName: string; entry: string }[]) {
    const message = missingEntries
      .map(
        missingEntry => `
- <code>${danger.github.utils.fileLinks(
          [getPackageChangelogPath(missingEntry.packageName)],
          false
        )}</code>
        
  Suggested entry:
  > _${missingEntry.entry}_`
      )
      .join('');

    warn(`
📋 **Missing Changelog**
------
### 🛠 Add missing entires to:
${message}`);
  }

  const modifiedPackages = groupBy(
    modified.filter(file => file.startsWith('packages')),
    file => file.split(path.sep)[1]
  );
  const packagesWithoutChangelogEntry = getPackagesWithoutChangelogEntry(modifiedPackages);

  console.log(packagesWithoutChangelogEntry);
  const suggestedEntries = getSuggestedChangelogEntriesForPackages(packagesWithoutChangelogEntry);
  createOrUpdateRP(suggestedEntries);
  // generateReport(suggestedEntries);
}

checkChangelog();
