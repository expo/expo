import chalk from 'chalk';
import type { Command } from 'commander';
import path from 'node:path';

import {
  processRepositories,
  processTasks,
  resolveTasksConfigAndroid,
  runCommand,
  validatePrebuild,
  withSpinner,
} from '../utils';

const tasksAndroid = async (command: Command) => {
  await validatePrebuild('android');

  const config = resolveTasksConfigAndroid(command.opts());
  const { stdout } = await withSpinner({
    operation: () =>
      runCommand('./gradlew', [`${config.library}:tasks`, '--group', 'publishing'], {
        cwd: path.join(process.cwd(), 'android'),
        verbose: config.verbose,
      }),
    loaderMessage: 'Reading publish tasks from the android project...',
    successMessage: 'Successfully read publish tasks from the android project\n',
    errorMessage: 'Failed to read publish tasks from the android project',
    verbose: config.verbose,
  });

  // Forwarded stdout already contains the tasks
  if (config.verbose) {
    return;
  }

  console.log(chalk.bold('Publishing tasks'));
  const tasks = processTasks(stdout);
  tasks.forEach((task) => {
    console.log(` - ${chalk.blue(task)}`);
  });
  console.log(chalk.bold('Repositories'));
  processRepositories(tasks).forEach((repository) => {
    console.log(` - ${chalk.blue(repository)}`);
  });
};

export default tasksAndroid;
