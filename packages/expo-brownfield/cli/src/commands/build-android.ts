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

  const extraGradleArgs = config.fused ? ['-Pbrownfield.fused=true'] : [];
  for (const task of config.tasks) {
    await runTask(task, config.verbose, config.dryRun, extraGradleArgs);
  }
};

export default buildAndroid;
