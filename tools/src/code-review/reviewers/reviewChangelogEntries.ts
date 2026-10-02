import path from 'node:path';

import { EXPO_DIR } from '../../Constants';
import { getExpoBranchPolicyAsync } from '../../changesets/Changesets';
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

  if (pullRequest.base.ref === 'main') {
    const majorChangesets = changesets.filter(({ changeset }) =>
      changeset?.releases.some((release) => release.type === 'major')
    );
    const minorChangesets = changesets.filter(({ changeset }) =>
      changeset?.releases.some((release) => release.type === 'minor')
    );
    if (majorChangesets.length || minorChangesets.length) {
      const policy = await getExpoBranchPolicyAsync('main');
      const majorBumpsDisallowed = policy?.allowMajor === false && majorChangesets.length > 0;
      const messages: string[] = [];

      if (majorBumpsDisallowed) {
        messages.push('Major bumps are not currently allowed on `main` (`allowMajor: false`).');
      }
      if (policy?.publish) {
        if (majorChangesets.length) {
          messages.push('Major releases may not be accepted during a beta period.');
        }
        if (minorChangesets.length) {
          messages.push(
            'Minor releases may not be accepted during a beta period. Use patch instead.'
          );
        }
      }
      if (messages.length) {
        const affected = changesets.filter(
          (entry) =>
            majorChangesets.includes(entry) || (policy?.publish && minorChangesets.includes(entry))
        );
        return {
          status: majorBumpsDisallowed ? ReviewStatus.ERROR : ReviewStatus.WARN,
          title: 'Changesets release policy on main',
          body:
            messages.join('\n\n') +
            '\n\n' +
            affected.map((entry) => `- \`${entry.path}\``).join('\n'),
        };
      }
    }
  }

  return { status: ReviewStatus.PASSIVE };
}
