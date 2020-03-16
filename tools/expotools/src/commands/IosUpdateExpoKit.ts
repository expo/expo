import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import plist from 'plist';
import semver from 'semver';
import inquirer from 'inquirer';
import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';

import { Directories, ExpoKit } from '../expotools';

const EXPO_DIR = Directories.getExpoRepositoryRootDir();

async function getCurrentBranchNameAsync() {
  const { stdout } = await spawnAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    cwd: EXPO_DIR,
  });
  return stdout.replace(/\n+$/, '');
}

function getAppVersion() {
  const infoPlistPath = path.join(EXPO_DIR, 'ios', 'Exponent', 'Supporting', 'Info.plist');
  const infoPlist = plist.parse(fs.readFileSync(infoPlistPath, 'utf8'));
  const bundleVersion = infoPlist.CFBundleShortVersionString;

  if (!bundleVersion) {
    console.error(`"CFBundleShortVersionString" not found in plist: ${infoPlistPath}`);
    process.exit(0);
    return;
  }
  return bundleVersion;
}

async function getSdkVersionAsync() {
  const { version: expoSdkVersion} = await JsonFile.readAsync<{version: string}>(
    path.join(EXPO_DIR, 'packages/expo/package.json')
  );
  return `${semver.major(expoSdkVersion)}.0.0`;
}

async function checkGitTagExistsAsync(tagName) {
  const { stdout } = await spawnAsync('git', ['ls-remote', 'origin', `refs/tags/${tagName}`], {
    cwd: EXPO_DIR,
  });
  return stdout.trim().length > 0;
}

async function action(options) {
  const appVersion = options.appVersion || getAppVersion();
  const sdkVersion = options.sdkVersion || (await getSdkVersionAsync());
  const currentBranch = await getCurrentBranchNameAsync();

  if (!/^sdk-\d+$/.test(currentBranch)) {
    console.error(
      chalk.red(
        `ExpoKit must be released from the release branch. ${chalk.cyan(
          currentBranch
        )} doesn't match ${chalk.grey('sdk-XX')} format for release branches.`
      )
    );
    process.exit(0);
    return;
  }

  const tagName = `ios/${appVersion}`;

  const { shouldTag }: { shouldTag?: boolean } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldTag',
      message: `Do you want to tag latest commit from branch ${chalk.cyan(
        currentBranch
      )} as ${chalk.blue(tagName)}?`,
      default: true,
    },
  ]);

  if (shouldTag) {
    const tagExists = await checkGitTagExistsAsync(tagName);

    if (tagExists) {
      const { overrideTag }: { overrideTag?: boolean } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overrideTag',
          message: chalk.yellow(
            `Tag ${chalk.blue(tagName)} already exists. Do you want to override it?`
          ),
          default: true,
        },
      ]);
      if (!overrideTag) {
        process.exit(0);
        return;
      }
    }

    console.log(
      `Tagging last commit from branch "${chalk.cyan(currentBranch)}" as "${chalk.blue(
        tagName
      )}"...`
    );

    options.dry ||
      (await spawnAsync(
        'git',
        [
          'tag',
          '-f',
          '-a',
          tagName,
          '-m',
          `ExpoKit v${appVersion} for SDK${semver.major(sdkVersion)}`,
        ],
        {
          stdio: 'inherit',
          cwd: EXPO_DIR,
        }
      ));

    console.log('Pushing tags to remote repo...');

    options.dry ||
      (await spawnAsync('git', ['push', '-f', 'origin', 'tag', tagName], {
        stdio: 'inherit',
        cwd: EXPO_DIR,
      }));
  }

  console.log(
    `Updating ${chalk.green('ExpoKit')}@${chalk.magenta(appVersion)} for SDK ${chalk.magenta(
      sdkVersion
    )} on staging...`
  );

  options.dry || (await ExpoKit.updateExpoKitIosAsync(EXPO_DIR, appVersion, sdkVersion));
}

export default (program: any) => {
  program
    .command('ios-update-expokit')
    .description('Tags ExpoKit version and updates staging ExpoKit files.')
    .option(
      '--appVersion [string]',
      'iOS ExpoKit version. Uses CFBundleShortVersionString from the Info.plist by default. (optional)'
    )
    .option(
      '--sdkVersion [string]',
      'SDK version included in the ExpoKit version. Defaults to major version of `expo` package in the repo. (optional)'
    )
    .option(
      '--dry',
      'Run the script in the dry mode, that is without tagging and updating ExpoKit.'
    )
    .asyncAction(action);
};
