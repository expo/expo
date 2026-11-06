import { Command } from '@expo/commander';

import {
  assertCleanWorkingTreeAsync,
  getExpoBranchPolicyAsync,
  getReleaseBranchAsync,
} from '../changesets/Changesets';
import {
  getPublishedPackagesPlanAsync,
  syncPublishedPackagesAsync,
} from '../changesets/SyncPublishedPackages';

export default (program: Command) => {
  program
    .command('sync-published-packages')
    .description(
      'Sync template SDK tags and www versions from the branch configured to publish latest.'
    )
    .option('-e, --env <staging|production>', 'www environment', 'staging')
    .option('--dry-run', 'Validate published versions and show changes without writing.', false)
    .asyncAction(async (options: { env: string; dryRun: boolean }) => {
      if (options.env !== 'staging' && options.env !== 'production') {
        throw new Error(`Unknown www environment: ${options.env}`);
      }
      const branchName = await getReleaseBranchAsync();
      const policy = await getExpoBranchPolicyAsync(branchName);
      if (policy?.publish !== 'latest') {
        throw new Error(
          `sync-published-packages cannot run from ${branchName} because it is not configured to publish latest. Check out the branch with publish set to "latest" in .changeset/expo.json and run the command again.`
        );
      }
      await assertCleanWorkingTreeAsync();
      const plan = await getPublishedPackagesPlanAsync();
      await syncPublishedPackagesAsync(plan, { env: options.env, dryRun: options.dryRun });
    });
};
