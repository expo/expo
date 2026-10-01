import { Command } from '@expo/commander';

import { runTurboTasksAsync } from '../Turbo';
import {
  assertCleanWorkingTreeAsync,
  assertChangesetPrerequisiteAsync,
  assertReleaseBranch,
  assertVersionCommitAsync,
  getReleaseBranchAsync,
  getPublishPlanAsync,
  getStablePublishArgsAsync,
  packChangesetsAsync,
  runChangesetsAsync,
} from '../changesets/Changesets';

type CommandOptions = { dryRun: boolean; force: boolean };

export default (program: Command) => {
  program
    .command('publish-packages')
    .option('--dry-run', 'Prepare and validate release artifacts without publishing.', false)
    .option(
      '-f, --force',
      'Publish despite pending changeset entries. Other release safeguards are not bypassed.',
      false
    )
    .description('Publish packages from an already-versioned stable release commit.')
    .asyncAction(async (options: CommandOptions) => {
      const branchName = await getReleaseBranchAsync();
      if (!options.force) {
        await assertReleaseBranch(branchName, 'stable');
        await assertCleanWorkingTreeAsync();
        await assertChangesetPrerequisiteAsync('absent', options.force);
        await assertVersionCommitAsync();
      }
      const publishPlan = await getPublishPlanAsync();
      if (publishPlan.length) {
        await runTurboTasksAsync(['build']);
        await runTurboTasksAsync(['precompile-ios', 'precompile-android']);
      }
      if (options.dryRun) {
        if (publishPlan.length) {
          await packChangesetsAsync('expo-changesets-pack-');
        }
        return;
      }
      if (publishPlan.length) {
        await runChangesetsAsync(await getStablePublishArgsAsync(branchName));
      }
    });
};
