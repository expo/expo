import spawnAsync from '@expo/spawn-async';
import type { Command } from 'commander';
import path from 'node:path';
import { styleText } from 'node:util';

import {
  processRepositories,
  processTasks,
  resolveTasksConfigAndroid,
  validatePrebuild,
  withSpinner,
} from '../utils';

const tasksAndroid = async (command: Command) => {
  await validatePrebuild('android');

  const config = resolveTasksConfigAndroid(command.opts());
  const { stdout } = await withSpinner({
    operation: () =>
      spawnAsync('./gradlew', [`${config.library}:tasks`, '--group', 'publishing'], {
        cwd: path.join(process.cwd(), 'android'),
        stdio: config.verbose ? 'inherit' : 'pipe',
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

  console.log(styleText('bold', 'Publishing tasks'));
  const tasks = processTasks(stdout);
  tasks.forEach((task) => {
    console.log(` - ${styleText('blue', task)}`);
  });
  console.log(styleText('bold', 'Repositories'));
  processRepositories(tasks).forEach((repository) => {
    console.log(` - ${styleText('blue', repository)}`);
  });
};

export default tasksAndroid;
