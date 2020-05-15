import { Command } from '@expo/commander';
import spawnAsync from '@expo/spawn-async';
import { Config, UpdateVersions } from '@expo/xdl';
import aws from 'aws-sdk';
import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';

import { STAGING_API_HOST, EXPO_DIR, IOS_DIR, ANDROID_DIR } from '../Constants';
import { Platform, iosAppVersionAsync, androidAppVersionAsync } from '../ProjectVersions';
import askForPlatformAsync from '../utils/askForPlatformAsync';
import Git from '../Git';

type ActionOptions = {
  platform?: 'ios';
  release: boolean;
};

async function askToRecreateSimulatorBuildAsync(archivePath: string) {
  if (process.env.CI) {
    return false;
  }
  const { createNew } = await inquirer.prompt<{ createNew: boolean }>([
    {
      type: 'confirm',
      name: 'createNew',
      message: `Simulator archive already exists at ${chalk.magenta(
        path.relative(EXPO_DIR, archivePath)
      )}. Do you want to create a fresh one?`,
      default: true,
    },
  ]);
  return createNew;
}

function getApplicationPathForPlatform(platform: Platform) {
  switch (platform) {
    case 'ios': {
      return path.join(
        IOS_DIR,
        'simulator-build',
        'Build',
        'Products',
        'Release-iphonesimulator',
        'Exponent.app'
      );
    }
    case 'android': {
      return path.join(ANDROID_DIR, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
    }
    default: {
      throw new Error(`Platform "${platform}" is not supported yet!`);
    }
  }
}

async function buildAndReleaseClientAsync(
  platform: Platform,
  sdkVersion: string | undefined,
  release: boolean
) {
  const appPath = getApplicationPathForPlatform(platform);

  if (!(await fs.pathExists(appPath)) || (await askToRecreateSimulatorBuildAsync(appPath))) {
    const args =
      platform === 'ios'
        ? ['ios', 'create_simulator_build']
        : ['android', 'build', 'build_type:Release'];

    await spawnAsync('fastlane', args, {
      cwd: EXPO_DIR,
      stdio: 'inherit',
      env: { ...process.env },
    });
  } else {
    console.log(`Using cached build at ${chalk.magenta(path.relative(EXPO_DIR, appPath))}...`);
  }

  if (sdkVersion && release) {
    await releaseBuildAsync(platform, appPath, sdkVersion);
  }
}

async function releaseBuildAsync(platform: Platform, appPath: string, sdkVersion: string) {
  const s3 = new aws.S3({ region: 'us-east-1' });

  switch (platform) {
    case 'ios': {
      const appVersion = await iosAppVersionAsync();
      console.log(
        `Uploading iOS ${chalk.cyan(
          appVersion
        )} build and saving its url to staging versions endpoint for SDK ${chalk.cyan(
          sdkVersion
        )}...`
      );
      return await UpdateVersions.updateIOSSimulatorBuild(s3, appPath, appVersion, sdkVersion);
    }
    case 'android': {
      const appVersion = await androidAppVersionAsync();
      console.log(
        `Uploading Android ${chalk.cyan(
          appVersion
        )} build and saving its url to staging versions endpoint for SDK ${chalk.cyan(
          sdkVersion
        )}...`
      );
      return await UpdateVersions.updateAndroidApk(s3, appPath, appVersion, sdkVersion);
    }
    default: {
      throw new Error(`Platform "${platform}" is not supported yet!`);
    }
  }
}

async function action(options: ActionOptions) {
  Config.api.host = STAGING_API_HOST;

  const platform = options.platform || (await askForPlatformAsync());
  const sdkVersion = (await Git.getSDKVersionFromBranchNameAsync()) || '20.0.0';

  if (options.release && !sdkVersion) {
    throw new Error(`Client builds can be released only from the release branch!`);
  }

  await buildAndReleaseClientAsync(platform, sdkVersion, options.release);
}

export default (program: Command) => {
  program
    .command('client-build')
    .alias('cb')
    .description(
      'Builds Expo client for iOS simulator or APK for Android, uploads the archive to S3 and saves its url to versions endpoint.'
    )
    .option('-p, --platform [string]', 'Platform for which the client will be built.')
    .option(
      '-r, --release',
      'Whether to upload and release the client build to staging versions endpoint.',
      false
    )
    .asyncAction(action);
};
