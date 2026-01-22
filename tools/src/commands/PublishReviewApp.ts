import { Command } from '@expo/commander';
import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import semver from 'semver';

import { EXPO_DIR } from '../Constants';
import logger from '../Logger';

const NCL_DIR = path.join(EXPO_DIR, 'apps/native-component-list');
const APP_JSON_PATH = path.join(NCL_DIR, 'app.json');
const EXPO_PACKAGE_JSON = path.join(EXPO_DIR, 'packages/expo/package.json');

const REVIEW_CONFIG = {
  owner: 'applereview',
  projectId: 'c7110aa0-424c-11e7-b474-e9583f4ae39c',
};

type ActionOptions = {
  configOnly: boolean;
};

async function getSDKVersion(): Promise<string> {
  const packageJson = await JsonFile.readAsync(EXPO_PACKAGE_JSON);
  const version = packageJson.version as string;
  const major = semver.major(version);
  return `${major}.0.0`;
}

function applyReviewConfig(appJson: any, sdkVersion: string): void {
  appJson.expo.owner = REVIEW_CONFIG.owner;
  appJson.expo.extra.eas.projectId = REVIEW_CONFIG.projectId;
  appJson.expo.updates = {
    url: `https://u.expo.dev/${REVIEW_CONFIG.projectId}`,
  };
  appJson.expo.sdkVersion = sdkVersion;
  appJson.expo.version = sdkVersion;
}

async function loginToAppleReview(): Promise<void> {
  logger.info('Logging in to applereview account...');

  const { password } = await inquirer.prompt<{ password: string }>([
    {
      type: 'password',
      name: 'password',
      message: 'Enter password for applereview account:',
      mask: '*',
    },
  ]);

  await spawnAsync('eas', ['login', '--username', 'applereview', '--password', password], {
    cwd: NCL_DIR,
    stdio: 'inherit',
  });
}

async function runEASUpdate(): Promise<void> {
  logger.info('Running eas update --branch main...');

  await spawnAsync('eas', ['update', '--branch', 'main'], {
    cwd: NCL_DIR,
    stdio: 'inherit',
  });
}

async function main(options: ActionOptions): Promise<void> {
  // Read current app.json (for backup/revert)
  const originalAppJson = await JsonFile.readAsync(APP_JSON_PATH);

  // Get SDK version
  const sdkVersion = await getSDKVersion();
  logger.info(`Setting sdkVersion and version to ${chalk.cyan(sdkVersion)}`);

  // Deep clone and apply review config
  const appJson = JSON.parse(JSON.stringify(originalAppJson));
  applyReviewConfig(appJson, sdkVersion);

  // Write updated app.json
  await JsonFile.writeAsync(APP_JSON_PATH, appJson);
  logger.success('Updated app.json');

  // If --config-only, exit here
  if (options.configOnly) {
    logger.info('Config-only mode: exiting without publishing');
    logger.info(`Run ${chalk.cyan('eas update --branch main')} when you are ready to publish`);
    return;
  }

  try {
    // Login to applereview
    await loginToAppleReview();

    // Run eas update
    await runEASUpdate();

    logger.success('EAS update completed');
  } finally {
    // Revert app.json to original
    logger.info('Reverting app.json to original state...');
    await JsonFile.writeAsync(APP_JSON_PATH, originalAppJson);
    logger.success('Reverted app.json');
  }
}

export default (program: Command) => {
  program
    .command('publish-review-app')
    .option('--config-only', 'Only set config, do not publish or revert', false)
    .description('Prepare and publish native-component-list for Apple review')
    .asyncAction(main);
};
