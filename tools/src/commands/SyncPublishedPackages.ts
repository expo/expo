import { Command } from '@expo/commander';

import { assertCleanWorkingTreeAsync, getReleaseBranchAsync } from '../changesets/Changesets';
import {
  getPublishedPackagesPlanAsync,
  syncPublishedPackagesAsync,
} from '../changesets/SyncPublishedPackages';

export default (program: Command) => {
  program
    .command('sync-published-packages')
    .description('Sync template SDK tags and www versions from the current main checkout.')
    .option('-e, --env <staging|production>', 'www environment', 'staging')
    .option('--dry-run', 'Validate published versions and show changes without writing.', false)
    .asyncAction(async (options: { env: string; dryRun: boolean }) => {
      if (options.env !== 'staging' && options.env !== 'production') {
        throw new Error(`Unknown www environment: ${options.env}`);
      }
      if ((await getReleaseBranchAsync()) !== 'main') {
        throw new Error('sync-published-packages must run from main');
      }
      await assertCleanWorkingTreeAsync();
      const plan = await getPublishedPackagesPlanAsync();
      await syncPublishedPackagesAsync(plan, { env: options.env, dryRun: options.dryRun });
    });
};
