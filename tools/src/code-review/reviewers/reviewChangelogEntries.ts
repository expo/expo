import path from 'node:path';

import { EXPO_DIR } from '../../Constants';
import { readChangedChangesetsAsync } from '../Changesets';
import { ReviewInput, ReviewOutput, ReviewStatus } from '../types';

export default async function ({ pullRequest, diff }: ReviewInput): Promise<ReviewOutput> {
  if (pullRequest.head?.ref.startsWith('changeset-release/')) {
    return { status: ReviewStatus.PASSIVE };
  }

  const directlyEditedChangelogs = diff
    .map((file) => file.path)
    .filter(
      (filePath) =>
        path.basename(filePath) === 'CHANGELOG.md' && path.dirname(filePath) !== EXPO_DIR
    )
    .map((filePath) => path.relative(EXPO_DIR, filePath));
  if (directlyEditedChangelogs.length > 0) {
    return {
      status: ReviewStatus.ERROR,
      title: 'Package changelogs are generated',
      body:
        'Do not edit package `CHANGELOG.md` files directly. Add a `.changeset/*.md` entry instead; ' +
        'the version-packages pull request generates the changelog.\n\n' +
        directlyEditedChangelogs.map((filePath) => `- \`${filePath}\``).join('\n'),
    };
  }

  const changesets = pullRequest.head ? await readChangedChangesetsAsync(pullRequest, diff) : [];
  const invalid = changesets.filter((changeset) => changeset.error);
  if (invalid.length > 0) {
    return {
      status: ReviewStatus.ERROR,
      title: 'Invalid Changesets entries',
      body: invalid.map((changeset) => `- \`${changeset.path}\`: ${changeset.error}`).join('\n'),
    };
  }

  const incomplete = changesets.filter(
    ({ changeset }) => !changeset?.releases.length || !changeset.summary.trim()
  );
  if (incomplete.length > 0) {
    return {
      status: ReviewStatus.ERROR,
      title: 'Incomplete Changesets entries',
      body:
        'Each changeset must select at least one package and include a user-facing summary:\n' +
        incomplete.map((changeset) => `- \`${changeset.path}\``).join('\n'),
    };
  }

  return { status: ReviewStatus.PASSIVE };
}
