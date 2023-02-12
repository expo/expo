import { Command } from '@expo/commander';
import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';
import { UserManager, UserSettings } from '@expo/xdl';
import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';
import semver from 'semver';

import { getAppsDir } from '../Directories';
import { getNewestSDKVersionAsync } from '../ProjectVersions';

type ActionOptions = {
  app: string;
  user: string;
  sdkVersion?: string;
};

const APPS_DIR = getAppsDir();

async function getDefaultSDKVersionAsync(): Promise<string | undefined> {
  const defaultIosSdkVersion = await getNewestSDKVersionAsync('ios');
  const defaultAndroidSdkVersion = await getNewestSDKVersionAsync('android');

  if (!defaultIosSdkVersion || !defaultAndroidSdkVersion) {
    throw new Error(
      `Unable to find newest SDK version. You must use ${chalk.red('--sdkVersion')} option.`
    );
  }
  return semver.gt(defaultIosSdkVersion, defaultAndroidSdkVersion)
    ? defaultIosSdkVersion
    : defaultAndroidSdkVersion;
}

function getExpoStatePaths(): { originalPath: string; backupPath: string } {
  const originalPath = UserSettings.userSettingsFile();
  const backupPath = path.join(path.dirname(originalPath), 'state-backup.json');
  return { originalPath, backupPath };
}

async function backupExpoStateAsync() {
  const { originalPath, backupPath } = getExpoStatePaths();
  await fs.copy(originalPath, backupPath);
}

async function restoreExpoStateAsync() {
  const { originalPath, backupPath } = getExpoStatePaths();
  await fs.move(backupPath, originalPath, { overwrite: true });
}

async function askForPasswordAsync(user: string): Promise<string> {
  const { password } = await inquirer.prompt<{ password: string }>([
    {
      type: 'input',
      name: 'password',
      message: `Provide a password to ${chalk.green(user)}:`,
    },
  ]);
  return password;
}

async function loginAndPublishAsync(options: ActionOptions) {
  const appRootPath = path.join(APPS_DIR, options.app);
  const password = await askForPasswordAsync(options.user);

  console.log(`Logging in as ${chalk.green(options.user)}...`);
  await UserManager.loginAsync('user-pass', { username: options.user, password });

  const appJson = new JsonFile(path.join(appRootPath, 'app.json'));
  const appSdkVersion = (await appJson.getAsync('expo.sdkVersion', null)) as string;

  if (appSdkVersion !== options.sdkVersion) {
    console.log(
      `App's ${chalk.yellow('expo.sdkVersion')} was set to ${chalk.blue(
        appSdkVersion
      )}, changing to ${chalk.blue(options.sdkVersion!)}...`
    );
    await appJson.setAsync('expo.sdkVersion', options.sdkVersion);
  }

  console.log(`Publishing ${chalk.cyan(options.app)} to ${chalk.green(options.user)} account...`);

  try {
    await spawnAsync('expo', ['publish'], {
      cwd: appRootPath,
      stdio: 'inherit',
      env: {
        ...process.env,
        EXPO_NO_DOCTOR: '1', // Needed when new SDK schema is not yet on production.
      },
    });
  } catch (error) {
    throw error;
  } finally {
    if (appSdkVersion !== options.sdkVersion) {
      console.log(
        `Reverting ${chalk.yellow('expo.sdkVersion')} to ${chalk.blue(appSdkVersion)}...`
      );
      await appJson.setAsync('expo.sdkVersion', appSdkVersion);
    }
  }
}

async function action(options: ActionOptions) {
  if (!options.app) {
    throw new Error('Run with `--app <string>`.');
  }

  const allowedApps = (await fs.readdir(APPS_DIR)).filter((item) =>
    fs.lstatSync(path.join(APPS_DIR, item)).isDirectory()
  );

  if (!allowedApps.includes(options.app)) {
    throw new Error(
      `App not found at ${chalk.cyan(options.app)} directory. Allowed app names: ${allowedApps
        .map((appDirname) => chalk.green(appDirname))
        .join(', ')}`
    );
  }

  const sdkVersion = options.sdkVersion || (await getDefaultSDKVersionAsync());

  if (!sdkVersion) {
    throw new Error('Next SDK version not found. Try to run with `--sdkVersion <SDK version>`.');
  }
  if (!options.sdkVersion) {
    console.log(`SDK version not provided - defaulting to ${chalk.cyan(sdkVersion)}`);
  }

  const initialUser = await UserManager.getCurrentUserAsync();

  if (initialUser) {
    console.log(
      `You're currently logged in as ${chalk.green(initialUser.username)} in ${chalk.cyan(
        'expo-cli'
      )} - backing up your user's session...`
    );
    await backupExpoStateAsync();
  }

  try {
    await loginAndPublishAsync({ ...options, sdkVersion });
  } catch (error) {
    throw error;
  } finally {
    if (initialUser) {
      console.log(
        `Restoring ${chalk.green(initialUser.username)} session in ${chalk.cyan('expo-cli')}...`
      );
      await restoreExpoStateAsync();
    } else {
      console.log(`Logging out from ${chalk.green(options.user)} account...`);
      await UserManager.logoutAsync();
    }
  }
}

export default (program: Command) => {
  program
    .command('publish-app')
    .alias('pub-app', 'pa')
    .description(`Publishes an app from ${chalk.magenta('apps')} folder.`)
    .option('-a, --app <string>', 'Specifies a name of the app to publish.')
    .option(
      '-u, --user <string>',
      'Specifies a username of Expo account on which to publish the app.'
    )
    .option(
      '-s, --sdkVersion [string]',
      'SDK version the published app should use. Defaults to the newest available SDK version.'
    )
    .asyncAction(action);
};
