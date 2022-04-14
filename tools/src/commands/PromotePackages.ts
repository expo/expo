import { Command } from '@expo/commander';

import { TaskRunner, Task } from '../TasksRunner';
import { listPackagesToPromote } from '../promote-packages/tasks/listPackagesToPromote';
import { promotePackages } from '../promote-packages/tasks/promotePackages';
import { CommandOptions, TaskArgs } from '../promote-packages/types';

export default (program: Command) => {
  program
    .command('promote-packages [packageNames...]')
    .alias('promote-pkgs')
    .option(
      '-e, --exclude <packageName>',
      'Name of the package to be excluded from promoting. Can be passed multiple times to exclude more than one package. It has higher priority than the list of package names to promote.',
      (value, previous) => previous.concat(value),
      []
    )
    .option(
      '-t, --tag <tag>',
      'Tag to which packages should be promoted. Defaults to `latest`.',
      'latest'
    )
    .option(
      '--no-select',
      'With this flag the script will not prompt to select packages, they all will be selected by default.',
      false
    )
    .option(
      '--no-drop',
      'Without this flag, existing tags for the local version would be dropped after all.',
      false
    )
    .option(
      '-d, --demote',
      'Enables tag demoting. If passed, the tag can be overriden even if its current version is higher than locally.',
      false
    )
    .option(
      '-l, --list',
      'Lists packages with unpublished changes since the previous version.',
      false
    )

    /* debug */
    .option('-D, --dry', 'Whether to skip `npm dist-tag add` command.', false)

    .description('Promotes local versions of monorepo packages to given tag on NPM repository.')
    .asyncAction(async (packageNames: string[], options: CommandOptions) => {
      // Commander doesn't put arguments to options object, let's add it for convenience. In fact, this is an option.
      options.packageNames = packageNames;

      const taskRunner = new TaskRunner<TaskArgs>({
        tasks: tasksForOptions(options),
      });

      await taskRunner.runAndExitAsync([], options);
    });
};

/**
 * Returns target task instances based on provided command options.
 */
function tasksForOptions(options: CommandOptions): Task<TaskArgs>[] {
  if (options.list) {
    return [listPackagesToPromote];
  }
  return [promotePackages];
}
