import { danger, warn } from 'danger';
import { groupBy } from 'lodash';

const fs = require('fs');
const path = require('path');

// Setup
const pr = danger.github.pr;
const modified = danger.git.modified_files;
const DEFAULT_CHANGELOG_ENTRY_KEY = 'default';

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
    return files.includes(changelogPath) || !fs.existsSync(`./${changelogPath}`);
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
  generateReport(getSuggestedChangelogEntriesForPackages(packagesWithoutChangelogEntry));
}

checkChangelog();
