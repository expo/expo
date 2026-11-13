import { Command } from '@expo/commander';

import { runCanaryAsync } from '../changesets/Canary';
import {
  assertChangesetPrerequisiteAsync,
  assertCleanWorkingTreeAsync,
  assertNoMajorChangesetsAsync,
  assertReleaseBranch,
  getReleaseBranchAsync,
} from '../changesets/Changesets';

type CommandOptions = { dryRun: boolean; force: boolean };

export default (program: Command) => {
  program
    .command('publish-canary')
    .option(
      '-f, --force',
      'Publish without pending changeset entries. Other release safeguards are not bypassed.',
      false
    )
    .option('--dry-run', 'Prepare the complete canary without publishing it to npm.', false)
    .description('Publish all public packages as a Changesets canary snapshot.')
    .asyncAction(async (options: CommandOptions) => {
      const branchName = await getReleaseBranchAsync();
      await assertReleaseBranch(branchName, 'canary');
      await assertCleanWorkingTreeAsync();
      const changesets = await assertChangesetPrerequisiteAsync('present', options.force);
      await assertNoMajorChangesetsAsync(changesets, branchName);
      await runCanaryAsync({ branchName, dryRun: options.dryRun });
    });
};
