// Provides dev-time typing structure for  `danger` - doesn't affect runtime.
import { DangerDSLType } from 'danger/distribution/dsl/DangerDSL';
import * as fs from 'fs';
import { groupBy } from 'lodash';
import * as path from 'path';
import spawnAsync from '@expo/spawn-async';

import { GithubWrapper } from './GithubWrapper';
import { getExpoRepositoryRootDir } from './Utils';

declare var danger: DangerDSLType;
declare function message(message: string): void;
declare function warn(message: string): void;
declare function fail(message: string): void;
declare function markdown(message: string): void;

const DEFAULT_CHANGELOG_ENTRY_KEY = 'default';

enum ChangelogEntryType {
  BUG_FIXES = 'bug-fix',
  NEW_FEATURES = 'new-feature',
  BREAKING_CHANGES = 'breaking-change',
}

const DEFAULT_ENTRY_TYPE = ChangelogEntryType.BUG_FIXES;

type ChangelogEntry = {
  type: ChangelogEntryType;
  message: string;
};

type PackageChangelogEntry = ChangelogEntry & {
  packageName: string;
};

type ChangelogEntries = {
  [DEFAULT_CHANGELOG_ENTRY_KEY]: ChangelogEntry;
  [key: string]: ChangelogEntry;
};

// Setup
const pr = danger.github.pr;
const modifiedFiles = danger.git.modified_files;
const prAuthor = pr.base.user.login;
const github = new GithubWrapper(danger.github.api, prAuthor, pr.base.repo.name);

/**
 * @param packageName for example: `expo-image-picker` or `unimodules-constatns-interface`
 * @returns relative path to package's changelog. For example: `packages/expo-image-picker/CHANGELOG.md`
 */
function getPackageChangelogPath(packageName: string): string {
  return path.join('packages', packageName, 'CHANGELOG.md');
}

async function getFileContentAsync(path: string): Promise<string> {
  const buffer = await fs.promises.readFile(path);
  return buffer.toString();
}

async function getFileDiffAsync(path): Promise<string> {
  const { stdout } = await spawnAsync('git', ['diff', '--', path], {
    cwd: getExpoRepositoryRootDir(),
  });
  return stdout;
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
 * If PR doesn't contais `# Changelog` section, this method returns:
 * {
 *   [DEFAULT_CHANGELOG_ENTRY_KEY]: <title of this pr without tags>
 * }
 * Otherwise, it tries to parse PR's body.
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
function wasChangelogModified(packageName: string, modifiedFiles: string[]): boolean {
  const changelogPath = getPackageChangelogPath(packageName);

  return (
    modifiedFiles.includes(changelogPath) ||
    !fs.existsSync(path.join(getExpoRepositoryRootDir(), changelogPath))
  );
}

function getPackagesWithoutChangelogEntry(modifiedPackages: { [Key: string]: string[] }): string[] {
  return Object.keys(modifiedPackages).filter(
    packageName => !wasChangelogModified(packageName, modifiedPackages[packageName])
  );
}

function getSuggestedChangelogEntries(
  packagesWithoutChangelogEntry: string[]
): PackageChangelogEntry[] {
  const {
    DEFAULT_CHANGELOG_ENTRY_KEY: defaultEntry,
    ...suggestedEntries
  } = getChangelogSuggestionFromPR();

  return packagesWithoutChangelogEntry.map(packageName => {
    const message = suggestedEntries[packageName]?.message ?? defaultEntry.message;
    const type = suggestedEntries[packageName]?.type ?? defaultEntry.type;
    return {
      packageName,
      message,
      type,
    };
  });
}

async function runAddChangelogCommand(
  suggestedEntries: PackageChangelogEntry[]
): Promise<Array<PackageChangelogEntry & { content: string; diff: string }>> {
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
        `--pullRequest`,
        `${pr.number}`,
      ])
    )
  );

  return Promise.all(
    suggestedEntries.map(async entry => {
      const changelogPath = path.join(
        getExpoRepositoryRootDir(),
        getPackageChangelogPath(entry.packageName)
      );
      return {
        ...entry,
        content: await getFileContentAsync(changelogPath),
        diff: await getFileDiffAsync(changelogPath),
      };
    })
  );
}

// @ts-ignore
async function createOrUpdateRP(
  missingEntries: { packageName: string; content: string }[]
): Promise<string | null> {
  const dangerHeadRef = `@danger/add-missing-changelog-to-${pr.number}`;
  const dangerBaseRef = pr.head.ref;
  const dangerMessage = `Add missing changelog`;
  const dangerTags = `[danger][bot]`;

  const fileMap = missingEntries.reduce(
    (prev, current) => ({
      ...prev,
      [getPackageChangelogPath(current.packageName)]: current.content,
    }),
    {}
  );

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
function generateReport(
  missingEntries: Array<{ packageName: string; diff: string }>,
  url?: string | null
) {
  const message = missingEntries
    .map(
      entry =>
        `- <code>${danger.github.utils.fileLinks(
          [getPackageChangelogPath(entry.packageName)],
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

export async function changelogCheck(): Promise<void> {
  const modifiedPackages = groupBy(
    modifiedFiles.filter(file => file.startsWith('packages')),
    file => file.split(path.sep)[1]
  );

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
