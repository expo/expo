import fs from 'fs-extra';
import path from 'path';

import { EXPO_DIR } from '../../Constants';
import logger from '../../Logger';
import { getListOfPackagesAsync, Package } from '../../Packages';
import { filterAsync } from '../../Utils';
import { ReviewInput, ReviewOutput, ReviewStatus } from '../types';

export default async function ({ pullRequest, diff }: ReviewInput): Promise<ReviewOutput | null> {
  if (!pullRequest.head) {
    logger.warn('Detached PR, we cannot asses the needed changelog entries!', pullRequest);
    return null;
  }

  const allPackages = await getListOfPackagesAsync();
  const modifiedPackages = allPackages.filter((pkg) => {
    return diff.some((fileDiff) => !path.relative(pkg.path, fileDiff.path).startsWith('../'));
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

  if (globalChangelogHasChanges) {
    return globalChangelogEntriesOutput(changelogLinks);
  } else if (pkgsWithoutChangelogChanges.length > 0) {
    return missingChangelogOutput(changelogLinks);
  }

  return null;
}

function relativeChangelogPath(head: ReviewInput['pullRequest']['head'], pkg: Package): string {
  const relativePath = path.relative(EXPO_DIR, pkg.changelogPath);
  return `[\`${relativePath}\`](${head.repo?.html_url}/blob/${head.ref}/${relativePath})`;
}

function missingChangelogOutput(changelogLinks: string): ReviewOutput {
  return {
    status: ReviewStatus.WARN,
    title: 'Missing changelog entries',
    body:
      'Your changes should be noted in the changelog. ' +
      'Read [Updating Changelogs](https://github.com/expo/expo/blob/main/guides/contributing/Updating%20Changelogs.md) ' +
      `guide and consider adding an appropriate entry to the following changelogs: \n${changelogLinks}`,
  };
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
