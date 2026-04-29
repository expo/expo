import { Command } from '@expo/commander';
import chalk from 'chalk';

import { Task, TaskRunner } from '../TasksRunner';
import { checkRepositoryStatus } from '../verify-cherrypicks/tasks/checkRepositoryStatus';
import { fixCherrypicks } from '../verify-cherrypicks/tasks/fixCherrypicks';
import { fixCherrypicksContinue } from '../verify-cherrypicks/tasks/fixCherrypicksContinue';
import { fixLabels } from '../verify-cherrypicks/tasks/fixLabels';
import { verifyCherrypicks } from '../verify-cherrypicks/tasks/verifyCherrypicks';
import { CommandOptions, TaskArgs } from '../verify-cherrypicks/types';

export default (program: Command) => {
  program
    .command('verify-cherrypicks')
    .alias('vcp')
    .option('-t, --tag <tag>', 'Limit verify to one branch only.')
    .option(
      '--fix',
      'Automatically cherry-pick all commits that are not on the target branch and update labels.',
      false
    )
    .option(
      '--continue',
      'Continue --fix cherry-picking without verifying local sdk branches.',
      false
    )
    .option(
      '--fix-labels',
      'Automatically fix labels on all PRs that are already cherry-picked.',
      false
    )
    .option('--merged-by <user>', 'Filter PRs merged by a specific user (GitHub login).', false)
    .option(
      '-D, --dry',
      'Print git commands instead of executing them. Skips updating labels.',
      false
    )
    .description(`Verify cherry-picks for all PRs with SDK labels.`)
    .usage(
      `

To list all PRs that need to be cherry-picked or need label updates:
${chalk.gray('>')} ${chalk.italic.cyan('et verify-cherrypicks')}

To fix labels on all PRs that are already cherry-picked:
${chalk.gray('>')} ${chalk.italic.cyan('et verify-cherrypicks --fix-labels')}

To cherry-pick all commits that are not on the target branch and update labels:
${chalk.gray('>')} ${chalk.italic.cyan('et verify-cherrypicks --fix')}`
    )
    .asyncAction(async (options: CommandOptions) => {
      const taskRunner = new TaskRunner<TaskArgs>({
        tasks: tasksForOptions(options),
      });

      await taskRunner.runAndExitAsync(
        {
          labels: [],
          pullRequests: {
            toCherrypick: [],
            toUpdateLabel: [],
            toVerify: [],
          },
        },
        options
      );
    });
};

/**
 * Returns target task instances based on provided command options.
 */
function tasksForOptions(options: CommandOptions): Task<TaskArgs>[] {
  if (options.fixLabels) {
    return [checkRepositoryStatus, verifyCherrypicks, fixLabels];
  }
  if (options.fix) {
    if (options.continue) {
      return [fixCherrypicksContinue, fixLabels];
    }
    return [fixCherrypicks, fixLabels];
  }
  return [verifyCherrypicks];
}
