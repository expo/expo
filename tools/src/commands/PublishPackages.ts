import { Command } from '@expo/commander';
import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';

import { EXPO_DIR } from '../Constants';
import logger from '../Logger';
import { runTurboTasksAsync } from '../Turbo';
import * as Versions from '../Versions';
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
      await assertReleaseBranch(branchName, 'stable');
      await assertCleanWorkingTreeAsync();
      await assertChangesetPrerequisiteAsync('absent', options.force);
      const publishPlan = await getPublishPlanAsync();
      await assertVersionCommitAsync();

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

      await updateVersionsEndpointAsync();
    });
};

async function updateVersionsEndpointAsync(): Promise<void> {
  const expoPackage = JSON.parse(
    await fs.promises.readFile(path.join(EXPO_DIR, 'packages/expo/package.json'), 'utf8')
  );
  const sdkVersion = `${semver.major(expoPackage.version)}.0.0`;
  const expoVersion = `~${expoPackage.version}`;

  logger.info(
    `Updating the versions endpoint for SDK ${sdkVersion} with expoVersion ${expoVersion}.`
  );
  await Versions.modifySdkVersionsAsync(sdkVersion, (sdkVersions) => ({
    ...sdkVersions,
    expoVersion,
  }));
}
