// Provides dev-time typing structure for  `danger` - doesn't affect runtime.
import { DangerDSLType } from 'danger/distribution/dsl/DangerDSL';
import * as fs from 'fs';
import { groupBy } from 'lodash';
import * as path from 'path';

import { GithubWrapper } from './GithubWrapper';
import { getExpoRepositoryRootDir } from './Utils';

declare var danger: DangerDSLType;
declare function message(message: string): void;
declare function warn(message: string): void;
declare function fail(message: string): void;

const DEFAULT_CHANGELOG_ENTRY_KEY = 'default';

enum ChangelogEntryType {
  BUG_FIXES = '🐛 Bug fixes',
  NEW_FEATURES = '🎉 New features',
  BREAKING_CHANGES = '🛠 Breaking changes',
}

const DEFAULT_ENTRY_TYPE = ChangelogEntryType.BUG_FIXES;

type ChangelogEntry = {
  type: ChangelogEntryType;
  message: string;
};

type ChangelogEntries = {
  [DEFAULT_CHANGELOG_ENTRY_KEY]: ChangelogEntry;
  [key: string]: ChangelogEntry;
};

// Setup
const pr = danger.github.pr;
const modifiedFiles = danger.git.modified_files;
const github = new GithubWrapper(danger.github.api, pr.base.user.login, pr.base.repo.name);

/**
 * @param packageName for example: `expo-image-picker` or `unimodules-constatns-interface`
 * @returns relatice path to package. For example: `packages/expo-image-picker/CHANGELOG.md`
 */
function getPackageChangelogPath(packageName: string): string {
  return path.join('packages', packageName, 'CHANGELOG.md');
}

function getTags(
  entry: string
): { packageName: string | typeof DEFAULT_CHANGELOG_ENTRY_KEY; type: ChangelogEntryType } | null {
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
function getChangelogSuggestionFromPR(): ChangelogEntries {
  const changelogEntries = {
    [DEFAULT_CHANGELOG_ENTRY_KEY]: {
      type: DEFAULT_ENTRY_TYPE,
      message: pr.title.replace(/\[.*\]/, '').trim(),
    },
  };

  const changelogTag = pr.body.match(/#\schangelog(([^#]*?)\s?)*/i)?.[0]?.replace(/^-/, '');
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
function wasChangelogModified(packageName: string, modifiedFiles: string[]): boolean {
  const changelogPath = getPackageChangelogPath(packageName);

  return (
    modifiedFiles.includes(changelogPath) ||
    !fs.existsSync(path.join(getExpoRepositoryRootDir(), changelogPath))
  );
}

/**
 * Add additional information, like PRs author and PRs link, to the entry.
 */
function addPRInfoToChangelogEntry(entry: string): string {
  // We need to escape link in that way to display them in their raw form.
  return `\\- ${entry} (\\[#<span/>${pr.number}](https:<span/>//github.com/expo/expo/pull/<span/>${pr.number}) by \\[@<span/>${pr.user.login}](https:<span/>//github.com/${pr.user.login}))`;
}

function getPackagesWithoutChangelogEntry(modifiedPackages: { [Key: string]: string[] }): string[] {
  return Object.keys(modifiedPackages).filter(
    packageName => !wasChangelogModified(packageName, modifiedPackages[packageName])
  );
}

function getSuggestedChangelogEntries(
  packagesWithoutChangelogEntry: string[]
): ({ packageName: string } & ChangelogEntry)[] {
  const {
    DEFAULT_CHANGELOG_ENTRY_KEY: defaultEntry,
    ...suggestedEntries
  } = getChangelogSuggestionFromPR();

  return packagesWithoutChangelogEntry.map(packageName => {
    const message = addPRInfoToChangelogEntry(
      suggestedEntries[packageName]?.message ?? defaultEntry.message
    );
    const type = suggestedEntries[packageName]?.type ?? defaultEntry.type;
    return {
      packageName,
      message,
      type,
    };
  });
}

// @ts-ignore
async function createOrUpdateRP(missingEntries: { packageName: string; entry: string }[]) {
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

function generateReport(missingEntries: Array<ChangelogEntry & { packageName: string }>) {
  const message = missingEntries
    .map(
      missingEntry => `
- <code>${danger.github.utils.fileLinks(
        [getPackageChangelogPath(missingEntry.packageName)],
        false
      )}</code>

Suggested entry:
> _${missingEntry.message}_`
    )
    .join('');

  fail(`
📋 **Missing Changelog**
------
### 🛠 Add missing entires to:
${message}`);
}

export async function changelogCheck(): Promise<boolean> {
  const modifiedPackages = groupBy(
    modifiedFiles.filter(file => file.startsWith('packages')),
    file => file.split(path.sep)[1]
  );

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
