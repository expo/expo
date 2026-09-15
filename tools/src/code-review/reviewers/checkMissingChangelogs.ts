import minimatch from 'minimatch';
import path from 'node:path';

import logger from '../../Logger';
import { getListOfPackagesAsync, Package } from '../../Packages';
import { readChangedChangesetsAsync } from '../Changesets';
import { ReviewInput, ReviewOutput, ReviewStatus } from '../types';

const IGNORED_PATHS = ['**/expo/bundledNativeModules.json'];

export default async function ({ pullRequest, diff }: ReviewInput): Promise<ReviewOutput | null> {
  if (!pullRequest.head) {
    logger.warn('Detached PR, we cannot assess the needed Changesets entries!', pullRequest);
    return null;
  }
  if (pullRequest.head.ref.startsWith('changeset-release/')) {
    return null;
  }

  const allPackages = await getListOfPackagesAsync();
  const modifiedPackages = allPackages.filter(
    (pkg) =>
      !pkg.packageJson.private &&
      diff.some(
        (fileDiff) =>
          isPathWithin(fileDiff.path, pkg.path) &&
          !IGNORED_PATHS.some((pattern) => minimatch(fileDiff.path, pattern))
      )
  );
  const changesets = await readChangedChangesetsAsync(pullRequest, diff);
  const releasedPackages = new Set(
    changesets.flatMap((changeset) =>
      (changeset.changeset?.releases ?? [])
        .filter((release) => release.type !== 'none')
        .map((release) => release.name)
    )
  );
  const missing = modifiedPackages.filter((pkg) => !releasedPackages.has(pkg.packageName));

  return missing.length > 0 ? missingChangesetOutput(missing) : null;
}

function isPathWithin(subpath: string, parent: string): boolean {
  return !path.relative(parent, subpath).startsWith('..');
}

function missingChangesetOutput(packages: Package[]): ReviewOutput {
  const packageNames = packages.map((pkg) => `- \`${pkg.packageName}\``).join('\n');
  return {
    status: ReviewStatus.WARN,
    title: 'Missing Changesets entries',
    body:
      'This pull request modifies published packages without recording release intent for them:\n' +
      `${packageNames}\n\n` +
      'Run `pnpm changeset` and select every package whose published contents or behavior changed. ' +
      'A changeset is unnecessary when these edits do not affect a published release.',
  };
}
