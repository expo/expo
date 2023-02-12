import chalk from 'chalk';
import inquirer from 'inquirer';

import Git from '../../Git';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { CommandOptions, Parcel, TaskArgs } from '../types';

const { cyan, yellow, blue } = chalk;

/**
 * Checks whether the current branch is correct and working dir is not dirty.
 */
export const checkRepositoryStatus = new Task<TaskArgs>(
  {
    name: 'checkRepositoryStatus',
    required: true,
    backupable: false,
  },
  async (parcels: Parcel[], options: CommandOptions): Promise<void | symbol> => {
    if (options.skipRepoChecks) {
      return;
    }
    logger.info(`\n🕵️‍♂️ Checking repository status...`);

    const currentBranch = await Git.getCurrentBranchNameAsync();
    const trackingBranch = await Git.getTrackingBranchNameAsync();

    // Check whether it's allowed to publish from the current branch.
    if (!(await checkBranchNameAsync(currentBranch))) {
      return Task.STOP;
    }

    // If tracking branch is set, then we must ensure it is still up-to-date with it.
    if (trackingBranch) {
      await Git.fetchAsync();

      const stats = await Git.compareBranchesAsync(currentBranch, trackingBranch);

      if (stats.ahead + stats.behind > 0) {
        logger.error(
          `🚫 Your local branch ${cyan(currentBranch)} is out of sync with remote branch.`
        );
        return Task.STOP;
      }
    }
    if (await Git.hasUnstagedChangesAsync()) {
      logger.error(`🚫 Repository contains unstaged changes, please make sure to have it clear.`);
      logger.error(`🚫 If you want to include them, they must be committed.`);
      return Task.STOP;
    }
  }
);

/**
 * Checks whether the command is run on main branch or package side-branch.
 * Otherwise, it prompts to confirm that you know what you're doing.
 * On CI it returns `true` only if run on `main` branch.
 */
async function checkBranchNameAsync(branchName: string) {
  if (process.env.CI) {
    // CI is allowed to publish only from main.
    return branchName === 'main';
  }

  // Publishes can be run on `main` or package's side-branches like `expo-package/1.x.x`
  if (branchName === 'main' || /^[\w\-@]+\/\d+\.(x\.x|\d+\.x)$/.test(branchName)) {
    return true;
  }

  logger.warn(
    '⚠️ ',
    `It's recommended to publish from ${blue('main')} branch, while you're at ${blue(branchName)}`
  );

  const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
    {
      type: 'confirm',
      name: 'confirmed',
      prefix: yellow('⚠️ '),
      message: yellow(`Do you want to proceed?`),
      default: true,
    },
  ]);
  logger.log();
  return confirmed;
}
