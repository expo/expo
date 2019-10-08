import chalk from 'chalk';
import semver from 'semver';
import inquirer from 'inquirer';
import { Command } from '@expo/commander';

import * as AndroidVersioning from '../versioning/android';
import * as IosVersioning from '../versioning/ios';
import { getExpoRepositoryRootDir } from '../Directories';
import { Platform, getNextSDKVersionAsync } from '../ProjectVersions';

type ActionOptions = {
  platform: Platform;
  sdkVersion?: string;
  filenames?: string;
};

const EXPO_DIR = getExpoRepositoryRootDir();

async function getNextOrAskForSDKVersionAsync(platform: Platform): Promise<string | undefined> {
  const defaultSdkVersion = await getNextSDKVersionAsync(platform);

  if (defaultSdkVersion && process.env.CI) {
    console.log(
      `${chalk.red('`--sdkVersion`')} not provided - defaulting to ${chalk.cyan(defaultSdkVersion)}`
    );
    return defaultSdkVersion;
  }

  const { sdkVersion } = await inquirer.prompt<{ sdkVersion: string }>([
    {
      type: 'input',
      name: 'sdkVersion',
      message: 'What is the SDK version that you want to add?',
      default: defaultSdkVersion,
      validate(value) {
        if (!semver.valid(value)) {
          return `Invalid version: ${chalk.cyan(value)}`;
        }
        return true;
      },
    },
  ]);
  return sdkVersion;
}

async function action(options: ActionOptions) {
  if (!options.platform) {
    throw new Error('Run with `--platform <ios | android>`.');
  }

  const sdkVersion = options.sdkVersion || (await getNextOrAskForSDKVersionAsync(options.platform));

  if (!sdkVersion) {
    throw new Error('Next SDK version not found. Try to run with `--sdkVersion <SDK version>`.');
  }

  switch (options.platform) {
    case 'ios':
      if (options.filenames) {
        return IosVersioning.versionReactNativeIOSFilesAsync(options.filenames, sdkVersion);
      } else {
        return IosVersioning.addVersionAsync(sdkVersion, EXPO_DIR);
      }
    case 'android':
      return AndroidVersioning.addVersionAsync(sdkVersion);
    default:
      throw new Error(`Platform '${options.platform}' is not supported.`);
  }
}

export default (program: Command) => {
  program
    .command('add-sdk-version')
    .alias('add-sdk')
    .description('Versions code for the new SDK version.')
    .usage(
      `

To version code for the new SDK on iOS, run:
${chalk.gray('>')} ${chalk.italic.cyan('et add-sdk-version --platform ios')}

To backport changes made in unversioned code into already versioned SDK, run:
${chalk.gray('>')} ${chalk.italic.cyan(
        'et add-sdk-version --platform ios --sdkVersion XX.0.0 --filenames */some/glob/expression/**'
      )}`
    )
    .option(
      '-p, --platform <string>',
      `Specifies a platform for which the SDK code should be generated. Supported platforms: ${chalk.cyan(
        'ios'
      )}.`
    )
    .option(
      '-s, --sdkVersion [string]',
      'SDK version to add. Defaults to the newest SDK version increased by a major update.'
    )
    .option(
      '-f, --filenames [string]',
      'Glob pattern of file paths to version. Useful when you want to backport unversioned code into already versioned SDK. Optional. When provided, option `--sdkVersion` is required.'
    )
    .asyncAction(action);
};
