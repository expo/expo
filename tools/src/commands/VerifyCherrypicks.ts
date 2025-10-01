import { Command } from '@expo/commander';
import chalk from 'chalk';

import { Task, TaskRunner } from '../TasksRunner';
import { fixCherrypicks } from '../verify-cherrypicks/tasks/fixCherrypicks';
import { verifyCherrypicks } from '../verify-cherrypicks/tasks/verifyCherrypicks';
import { CommandOptions, TaskArgs } from '../verify-cherrypicks/types';

export default (program: Command) => {
  program
    .command('verify-cherrypicks')
    .alias('vcp')
    .option('-t, --tag <tag>', 'Sdk branch to verify.', 'sdk-53')
    .option(
      '--fix',
      'Automatically cherry-pick all commits that are not on the target branch.',
      false
    )
    .option('--continue', 'Continue cherry-picking without verifying local sdk branches.', false)
    .option(
      '-D, --dry',
      'Whether to skip pushing publish commit to remote repo and run `npm publish` in dry mode. Despite this, some files might be changed and committed.',
      false
    )
    .description(`sadas.`)
    .usage(
      `

To list packages with unpublished changes:
${chalk.gray('>')} ${chalk.italic.cyan('et publish -l')}

To publish all packages with unpublished changes:
${chalk.gray('>')} ${chalk.italic.cyan('et publish')}

To publish just specific packages and their dependencies:
${chalk.gray('>')} ${chalk.italic.cyan('et publish expo-gl expo-auth-session')}`
    )
    .asyncAction(async (options: CommandOptions) => {
      const taskRunner = new TaskRunner<TaskArgs>({
        tasks: tasksForOptions(options),
      });

      await taskRunner.runAndExitAsync({ pullRequestsByLabel: [] }, options);
    });
};

/**
 * Returns target task instances based on provided command options.
 */
function tasksForOptions(options: CommandOptions): Task<TaskArgs>[] {
  if (options.fix) {
    return [fixCherrypicks];
  }
  return [verifyCherrypicks];
}
