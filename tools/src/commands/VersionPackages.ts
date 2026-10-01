import { Command } from '@expo/commander';

import logger from '../Logger';
import {
  assertCleanWorkingTreeAsync,
  assertNoMajorChangesetsAsync,
  assertReleaseBranch,
  getReleaseBranchAsync,
  getPendingChangesetsAsync,
  runChangesetsAsync,
} from '../changesets/Changesets';
import {
  captureWorkspaceVersionsAsync,
  getVersionedPackagesAsync,
  refreshPnpmLockfileAsync,
  updateVersionDerivedFilesAsync,
} from '../changesets/Versioning';

type CommandOptions = { force: boolean };

export default (program: Command) => {
  program
    .command('version-packages')
    .option(
      '-f, --force',
      'Publish despite pending changeset entries. Other release safeguards are not bypassed.',
      false
    )
    .description(
      'Consume pending changesets and update the checkout to the package release-PR state.'
    )
    .asyncAction(async (options: CommandOptions) => {
      const branchName = await getReleaseBranchAsync();
      if (!options.force) {
        await assertReleaseBranch(branchName, 'stable');
        await assertCleanWorkingTreeAsync();
        const changesets = await getPendingChangesetsAsync();
        if (!changesets.length) {
          logger.success('No pending changeset entries to version.');
          return;
        }
        await assertNoMajorChangesetsAsync(changesets, branchName);
      }
      const before = await captureWorkspaceVersionsAsync();
      await runChangesetsAsync(['version']);
      const versionedPackages = await getVersionedPackagesAsync(before);
      await updateVersionDerivedFilesAsync(versionedPackages);
      await refreshPnpmLockfileAsync();
    });
};
