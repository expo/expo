import { Command } from '@expo/commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import semver from 'semver';

import { Platform, getNextSDKVersionAsync } from '../ProjectVersions';
import * as AndroidVersioning from '../versioning/android';
import * as IosVersioning from '../versioning/ios';

type ActionOptions = {
  platform: Platform;
  sdkVersion?: string;
  filenames?: string;
  vendored: string[];
  reinstall?: boolean;
  preventReinstall?: boolean;
  package?: string;
};

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
  const sdkNumber = semver.major(sdkVersion);

  switch (options.platform) {
    case 'ios':
      if (options.vendored.length > 0) {
        await IosVersioning.versionVendoredModulesAsync(sdkNumber, options.vendored);
      } else if (options.filenames) {
        await IosVersioning.versionReactNativeIOSFilesAsync(options.filenames, sdkVersion);
      } else if (options.package) {
        await IosVersioning.regenerateVersionedPackageAsync(sdkVersion, options.package);
      } else {
        await IosVersioning.versionVendoredModulesAsync(sdkNumber, null);
        await IosVersioning.addVersionAsync(sdkVersion);
      }
      await IosVersioning.reinstallPodsAsync(options.reinstall, options.preventReinstall);
      return;
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
    .option(
      '-v, --vendored <string>',
      'Name of the vendored module to (re)version. iOS only.',
      (value, previous) => (previous ?? []).concat(value),
      []
    )
    .option(
      '-r, --reinstall',
      'Whether to force reinstalling pods after generating a new version. iOS only.'
    )
    .option(
      '--prevent-reinstall',
      'Whether to force not reinstalling pods after generating a new version. iOS only.'
    )
    .option(
      '-x, --package [string]',
      'Only generate a specific package. When provided, option `--sdkVersion` is required.'
    )
    .asyncAction(action);
};
