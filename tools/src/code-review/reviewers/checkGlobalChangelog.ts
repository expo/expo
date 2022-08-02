import path from 'path';

import { EXPO_DIR } from '../../Constants';
import logger from '../../Logger';
import { getListOfPackagesAsync, Package } from '../../Packages';
import { ReviewInput, ReviewOutput, ReviewStatus } from '../types';

export default async function ({ pullRequest, diff }: ReviewInput): Promise<ReviewOutput | null> {
  if (!pullRequest.head) {
    logger.warn('Detached PR, we cannot asses the needed changelog entries!', pullRequest);
    return null;
  }

  const globalChangelogHasChanges = diff.some(
    (fileDiff) => path.relative(EXPO_DIR, fileDiff.path) === 'CHANGELOG.md'
  );
  if (!globalChangelogHasChanges) {
    return null;
  }

  const allPackages = await getListOfPackagesAsync();
  const modifiedPackages = allPackages.filter((pkg) => {
    return diff.some((fileDiff) => !path.relative(pkg.path, fileDiff.path).startsWith('../'));
  });

  const changelogLinks = modifiedPackages
    .map((pkg) => `- ${relativeChangelogPath(pullRequest.head, pkg)}`)
    .join('\n');

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

function relativeChangelogPath(head: ReviewInput['pullRequest']['head'], pkg: Package): string {
  const relativePath = path.relative(EXPO_DIR, pkg.changelogPath);
  return `[\`${relativePath}\`](${head.repo?.html_url}/blob/${head.ref}/${relativePath})`;
}
