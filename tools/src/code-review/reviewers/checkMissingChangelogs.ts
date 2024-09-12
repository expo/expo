import fs from 'fs-extra';
import minimatch from 'minimatch';
import path from 'path';

import { ANDROID_VENDORED_DIR, EXPO_DIR, IOS_VENDORED_DIR } from '../../Constants';
import { GitFileDiff } from '../../Git';
import { PullRequest } from '../../GitHub';
import logger from '../../Logger';
import { getListOfPackagesAsync, Package } from '../../Packages';
import { filterAsync } from '../../Utils';
import { markdownLink } from '../reports';
import { ReviewInput, ReviewOutput, ReviewStatus } from '../types';

// glob patterns for paths where changes are negligible
const IGNORED_PATHS = ['**/expo/bundledNativeModules.json'];

export default async function ({ pullRequest, diff }: ReviewInput): Promise<ReviewOutput | null> {
  if (!pullRequest.head) {
    logger.warn('Detached PR, we cannot asses the needed changelog entries!', pullRequest);
    return null;
  }

  const allPackages = await getListOfPackagesAsync();
  const modifiedPackages = allPackages.filter((pkg) => {
    return diff.some((fileDiff) => {
      return (
        isPathWithin(fileDiff.path, pkg.path) &&
        !IGNORED_PATHS.some((pattern) => minimatch(fileDiff.path, pattern))
      );
    });
  });

  const pkgsWithoutChangelogChanges = await filterAsync(modifiedPackages, async (pkg) => {
    const pkgHasChangelog = await fs.pathExists(pkg.changelogPath);
    return pkgHasChangelog && diff.every((fileDiff) => fileDiff.path !== pkg.changelogPath);
  });

  const globalChangelogHasChanges = diff.some(
    (fileDiff) => path.relative(EXPO_DIR, fileDiff.path) === 'CHANGELOG.md'
  );

  const changelogLinks = pkgsWithoutChangelogChanges
    .map((pkg) => `- ${relativeChangelogPath(pullRequest.head, pkg)}`)
    .join('\n');

  if (globalChangelogHasChanges && !isModifyingVendoredModules(diff)) {
    return globalChangelogEntriesOutput(changelogLinks);
  } else if (pkgsWithoutChangelogChanges.length > 0) {
    return missingChangelogOutput(changelogLinks, pullRequest);
  }

  return null;
}

function isModifyingVendoredModules(diff: GitFileDiff[]): boolean {
  return diff.some(
    (fileDiff) =>
      isPathWithin(fileDiff.path, IOS_VENDORED_DIR) ||
      isPathWithin(fileDiff.path, ANDROID_VENDORED_DIR)
  );
}

function isPathWithin(subpath: string, parent: string): boolean {
  return !path.relative(parent, subpath).startsWith('..');
}

function relativeChangelogPath(head: ReviewInput['pullRequest']['head'], pkg: Package): string {
  const relativePath = path.relative(EXPO_DIR, pkg.changelogPath);
  return `[\`${relativePath}\`](${head.repo?.html_url}/blob/${head.ref}/${relativePath})`;
}

function missingChangelogOutput(changelogLinks: string, pullRequest: PullRequest): ReviewOutput {
  return {
    status: ReviewStatus.WARN,
    title: 'Missing changelog entries',
    body:
      'Your changes should be noted in the changelog, e.g.: \n' +
      generateChangelogStub(pullRequest) +
      '\n' +
      'Read [Updating Changelogs](https://github.com/expo/expo/blob/main/guides/contributing/Updating%20Changelogs.md) ' +
      `guide and consider adding an appropriate entry to the following changelogs: \n${changelogLinks}`,
  };
}

function generateChangelogStub(pullRequest: PullRequest) {
  const prLink = markdownLink('#' + pullRequest.number, pullRequest.html_url);
  const userLink = markdownLink('@' + pullRequest.user!.login, pullRequest.user!.html_url);
  const suggestedTitle = filterBracketContent(pullRequest.title);

  return `\`- ${suggestedTitle} (${prLink} by ${userLink})\``;
}

function filterBracketContent(input: string): string {
  // many PR titles start with package name (e.g. [video]). We don't want that in a package-specific changelog.
  return input.replace(/\[.*?\]/, '').trim();
}

function globalChangelogEntriesOutput(changelogLinks: string): ReviewOutput {
  return {
    status: ReviewStatus.ERROR,
    title: 'Changelog entry in wrong CHANGELOG file',
    body:
      'Your changelog entries should be noted in package-specific changelogs. ' +
      'Read [Updating Changelogs](https://github.com/expo/expo/blob/main/guides/contributing/Updating%20Changelogs.md) ' +
      'guide and move changelog entries from the global **CHANGELOG.md** to ' +
      (changelogLinks.length > 0
        ? `the following changelogs: \n${changelogLinks}`
        : 'appropriate package-specific changelogs.'),
  };
}
