import { Command } from '@expo/commander';
import chalk from 'chalk';
import fs from 'fs';
import inquirer from 'inquirer';

import Logger from '../Logger';
import { getProjectRoot } from '../run-stories/helpers';
import { getPackageNameAsync } from '../run-stories/tasks/getPackageNameAsync';
import { initializeDefaultsAsync } from '../run-stories/tasks/initializeDefaultsAsync';
import { initializeExpoAppAsync } from '../run-stories/tasks/initializeExpoAppAsync';
import { runPrebuildAsync } from '../run-stories/tasks/runPrebuildAsync';
import { runStoryProcessesAsync } from '../run-stories/tasks/runStoryProcessesAsync';

export default (program: Command) => {
  program
    .command('run-stories [packageName]')
    .option('-r, --rebuild', 'Rebuild the project from scratch')
    .option('-p, --platform <string>', 'The platform the app will run in')
    .asyncAction(action);
};

type Platform = 'android' | 'ios' | 'web';

type Action = {
  platform: Platform;
  rebuild: boolean;
};

async function action(name: string, { platform, rebuild = false }: Action) {
  const packageName = await getPackageNameAsync(name);
  const projectRoot = getProjectRoot(packageName);

  await initializeDefaultsAsync(packageName);

  const isFirstBuild = !fs.existsSync(projectRoot);

  if (rebuild || isFirstBuild) {
    Logger.log();
    Logger.log(`🛠   Scaffolding a fresh project for ${chalk.bold(packageName)} in expo/stories`);

    await initializeExpoAppAsync(packageName);

    Logger.log('🔌  Applying config plugins');
    await runPrebuildAsync(packageName);
  }

  if (!platform) {
    const { selectedPlatform } = await inquirer.prompt({
      type: 'list',
      name: 'selectedPlatform',
      message: 'Which platform are you working on?',
      choices: [
        { value: 'ios', name: 'iOS' },
        { value: 'android', name: 'Android' },
        { value: 'web', name: 'Web' },
      ],
    });

    platform = selectedPlatform;
  }

  Logger.log(`🛠   Building for ${platform}...this may take a few minutes`);
  Logger.log();

  await runStoryProcessesAsync(packageName, platform);
}
