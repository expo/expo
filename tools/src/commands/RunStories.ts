import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import inquirer from 'inquirer';
import path from 'path';

import { podInstallAsync } from '../CocoaPods';
import Logger from '../Logger';
import { getProjectRoot } from '../run-stories/helpers';
import { clearNativeCache } from '../run-stories/tasks/clearNativeCache';
import { copyTemplateFiles } from '../run-stories/tasks/copyTemplateFiles';
import { getPackageNameAsync } from '../run-stories/tasks/getPackageNameAsync';
import { initializeExpoAppAsync } from '../run-stories/tasks/initializeExpoAppAsync';
import { runPrebuildAsync } from '../run-stories/tasks/runPrebuildAsync';
import { runStoryProcessesAsync } from '../run-stories/tasks/runStoryProcessesAsync';

type Platform = 'android' | 'ios' | 'web';

type Action = {
  platform: Platform;
  rebuild: boolean;
  clearCache: boolean;
};

async function selectPlatformAsync(): Promise<Platform> {
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

  return selectedPlatform;
}

async function action(name: string, { platform, rebuild = false, clearCache = false }: Action) {
  const packageName = await getPackageNameAsync(name);

  const projectRoot = getProjectRoot(packageName);

  const isFirstBuild = !fs.existsSync(projectRoot);

  if (rebuild || isFirstBuild) {
    Logger.log();
    Logger.info(`🛠  Scaffolding fresh story loader project for ${packageName}`);

    await initializeExpoAppAsync(packageName);
    await runPrebuildAsync(packageName);

    copyTemplateFiles(packageName);

    // 4. yarn + install deps
    Logger.log('🧶 Yarning...');
    await spawnAsync('yarn', ['install'], { cwd: projectRoot });
  }

  if (clearCache) {
    Logger.log('🧶 Clearing native cache...');
    clearNativeCache(packageName);
  }

  if (!platform) {
    platform = await selectPlatformAsync();
  }

  if (platform === 'web') {
    // TODO
  } else {
    if (rebuild || isFirstBuild) {
      Logger.log('☕️ Installing native dependencies');
      await podInstallAsync(path.resolve(projectRoot, 'ios'));
    }

    Logger.log(`🛠  Building for ${platform}...this may take a few minutes`);
    Logger.log();

    await runStoryProcessesAsync(packageName, platform);
  }
}

export default (program: any) => {
  program
    .command('run-stories [packageName]')
    .option('-r, --rebuild', 'Rebuild the project from scratch')
    .option('-c, --clear-cache', 'Clear and reinstall depedencies')
    .option('-p, --platform <string>', 'The platform the app will run in')
    .asyncAction(action);
};
