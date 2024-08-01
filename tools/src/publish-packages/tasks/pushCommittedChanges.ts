import { commitStagedChanges } from './commitStagedChanges';
import Git from '../../Git';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { CommandOptions, Parcel, TaskArgs } from '../types';

/**
 * Pushes committed changes to remote repo.
 */
export const pushCommittedChanges = new Task<TaskArgs>(
  {
    name: 'pushCommittedChanges',
    dependsOn: [commitStagedChanges],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    logger.info('\n🏋️  Pushing committed changes to remote repository...');

    if (options.dry) {
      logger.debug('   Skipping due to --dry flag...');
      return;
    }
    const currentBranch = await Git.getCurrentBranchNameAsync();
    await Git.pushAsync({ track: currentBranch });
  }
);
