import type { Command } from 'commander';

import {
  CLIError,
  printAndroidConfig,
  resolveBuildConfigAndroid,
  runTask,
  validatePrebuild,
} from '../utils';

const buildAndroid = async (command: Command) => {
  await validatePrebuild('android');

  const config = resolveBuildConfigAndroid(command.opts());
  if (!config.tasks.length) {
    CLIError.handle('android-task-repo');
  }
  printAndroidConfig(config);

  config.tasks.forEach(async (task) => {
    await runTask(task, config.verbose, config.dryRun);
  });
};

export default buildAndroid;
