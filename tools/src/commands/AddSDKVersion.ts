import { Command } from '@expo/commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import semver from 'semver';

import { getListOfPackagesAsync } from '../Packages';
import { Platform, getNextSDKVersionAsync, resolveSDKVersionAsync } from '../ProjectVersions';
import * as AndroidVersioning from '../versioning/android';
import * as IosVersioning from '../versioning/ios';

type ActionOptions = {
  platform: Platform;
  sdkVersion?: string;
  filenames?: string;
  vendored: string[];
  reinstall?: boolean;
  preventReinstall?: boolean;
  packages?: string[];
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

  const sdkVersion =
    (options.sdkVersion && (await resolveSDKVersionAsync(options.sdkVersion, options.platform))) ||
    (await getNextOrAskForSDKVersionAsync(options.platform));

  if (!sdkVersion) {
    throw new Error('Next SDK version not found. Try to run with `--sdkVersion <SDK version>`.');
  }
  const sdkNumber = semver.major(sdkVersion);
  const packages = (await getListOfPackagesAsync()).filter((pkg) =>
    pkg.isVersionableOnPlatform(options.platform)
  );

  switch (options.platform) {
    case 'ios':
      if (options.vendored.length > 0) {
        await IosVersioning.versionVendoredModulesAsync(sdkNumber, options.vendored);
      } else if (options.filenames) {
        await IosVersioning.versionReactNativeIOSFilesAsync(options.filenames, sdkVersion);
      } else if (options.packages) {
        await IosVersioning.versionExpoModulesAsync(
          sdkNumber,
          packages.filter((pkg) => options.packages?.includes(pkg.packageName))
        );
      } else {
        await IosVersioning.versionVendoredModulesAsync(sdkNumber, null);
        await IosVersioning.addVersionAsync(sdkVersion, packages);
      }
      await IosVersioning.reinstallPodsAsync(options.reinstall, options.preventReinstall);
      return;
    case 'android':
      await AndroidVersioning.addVersionAsync(sdkVersion);
      await AndroidVersioning.versionVendoredModulesAsync(sdkNumber, null);
      return;
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
      'SDK version to add. Can be a full version name, major number or `next` tag. Defaults to `next` on the CI.'
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
    .option('-x, --packages <string...>', 'Name of the expo package to version.')
    .asyncAction(action);
};
