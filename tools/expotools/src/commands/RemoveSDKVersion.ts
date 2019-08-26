import chalk from 'chalk';
import semver from 'semver';
import inquirer from 'inquirer';
import { Command } from '@expo/commander';

import * as IosVersioning from '../versioning/ios';
import { getExpoRepositoryRootDir } from '../Directories';
import { Platform, getOldestSDKVersionAsync } from '../ProjectVersions';

type ActionOptions = {
  platform: Platform;
  sdkVersion?: string;
}

const EXPO_DIR = getExpoRepositoryRootDir();

async function getOldestOrAskForSDKVersionAsync(platform: Platform): Promise<string | undefined> {
  const defaultSdkVersion = await getOldestSDKVersionAsync(platform);

  if (defaultSdkVersion && process.env.CI) {
    console.log(`${chalk.red('`--sdkVersion`')} not provided - defaulting to ${chalk.cyan(defaultSdkVersion)}`);
    return defaultSdkVersion;
  }

  const { sdkVersion } = await inquirer.prompt<{ sdkVersion: string }>([
    {
      type: 'input',
      name: 'sdkVersion',
      message: 'What is the SDK version that you want to remove?',
      default: defaultSdkVersion,
      validate(value) {
        if (!semver.valid(value)) {
          return `Invalid version: ${chalk.cyan(value)}`;
        }
        return true;
      },
    }
  ]);
  return sdkVersion;
}

async function action(options: ActionOptions) {
  if (!options.platform) {
    throw new Error('Run with `--platform <ios | android>`.');
  }

  const sdkVersion = options.sdkVersion || await getOldestOrAskForSDKVersionAsync(options.platform);

  if (!sdkVersion) {
    throw new Error('Oldest SDK version not found. Try to run with `--sdkVersion <SDK version>`.');
  }

  switch (options.platform) {
    case 'ios':
      return IosVersioning.removeVersionAsync(sdkVersion, EXPO_DIR);
    default:
      throw new Error(`Platform '${options.platform}' is not supported.`);
  }
}

export default (program: Command) => {
  program
    .command('remove-sdk-version')
    .alias('remove-sdk', 'rm-sdk')
    .description('Removes SDK version.')
    .usage(`
    
To remove versioned code for the oldest supported SDK on iOS, run:
${chalk.gray('>')} ${chalk.italic.cyan('et remove-sdk-version --platform ios')}`
    )
    .option('-p, --platform <string>', `Specifies a platform for which the SDK code should be removed. Supported platforms: ${chalk.cyan('ios')}.`)
    .option('-s, --sdkVersion [string]', 'SDK version to remove. Defaults to the oldest supported SDK version.')
    .asyncAction(action);
};
