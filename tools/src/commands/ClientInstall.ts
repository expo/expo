import { Command } from '@expo/commander';
import chalk from 'chalk';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Writable } from 'node:stream';
import { extract as tarExtract } from 'tar';

import * as AndroidDevice from '../AndroidDevice';
import * as Simulator from '../IOSSimulator';
import { Platform, getNewestSDKVersionAsync } from '../ProjectVersions';
import * as Versions from '../Versions';
import askForPlatformAsync from '../utils/askForPlatformAsync';
import askForSDKVersionAsync from '../utils/askForSDKVersionAsync';

type ActionOptions = {
  platform?: Platform;
  sdkVersion?: string;
  production?: boolean;
};

const EXPO_GO_APP_ID_IOS = 'host.exp.Exponent';
const EXPO_GO_APP_ID_ANDROID = 'host.exp.exponent';

async function downloadAndInstallOnIOSAsync(downloadUrl: string): Promise<void> {
  if (!(await Simulator.isSimulatorInstalledAsync())) {
    throw new Error('iOS simulator is not installed.');
  }

  const simulator = await Simulator.queryFirstBootedSimulatorAsync();
  if (!simulator) {
    throw new Error('No booted iOS simulator found.');
  }

  console.log('Uninstalling previously installed Expo Go...');

  await Simulator.uninstallAppFromSimulatorAsync(simulator, EXPO_GO_APP_ID_IOS);

  console.log(`Downloading Expo Go from ${chalk.blue(downloadUrl)}`);
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'expotools-client-install-'));
  try {
    const downloadFilePath = await downloadExpoGoAsync({ downloadUrl, targetDir: tmpDir });
    const appPath = path.join(tmpDir, 'Expo Go.app');
    await fs.promises.mkdir(appPath, { recursive: true });
    await tarExtract({
      file: downloadFilePath,
      cwd: appPath,
      strip: 1,
    });
    console.log(`Extracted to ${chalk.blue(tmpDir)}`);
    console.log(`Installing Expo Go from ${chalk.blue(appPath)} on iOS simulator...`);
    await Simulator.installSimulatorAppAsync(simulator, appPath);
    console.log(`Launching Expo Go with identifier ${chalk.blue(EXPO_GO_APP_ID_IOS)}...`);
    await Simulator.launchSimulatorAppAsync(simulator, EXPO_GO_APP_ID_IOS);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(chalk.red(`Unable to install Expo Go: ${error.message}`));
    }
  } finally {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  }
}

async function downloadAndInstallOnAndroidAsync(downloadUrl: string): Promise<void> {
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'expotools-client-install-'));
  try {
    console.log('Checking if the are any Android devices or emulators connected...');

    const devices = await AndroidDevice.getAttachedDevicesAsync();
    if (devices.length === 0) {
      throw new Error('No connected devices or emulators found.');
    }

    const device = devices[0];
    if (devices.length > 1) {
      console.log(
        `More than one Android device found. Installing on the first one found, ${device}.`
      );
    }

    console.log('Uninstalling previously installed Expo Go...');

    try {
      await AndroidDevice.uninstallAppAsync({ device, appId: EXPO_GO_APP_ID_ANDROID });
    } catch {}

    console.log(`Downloading Expo Go from ${chalk.blue(downloadUrl)}`);
    const downloadFilePath = await downloadExpoGoAsync({ downloadUrl, targetDir: tmpDir });
    console.log(
      `Installing Expo Go from ${chalk.blue(downloadFilePath)} on Android device ${chalk.blue(device)}...`
    );

    await AndroidDevice.installAppAsync({ device, appPath: downloadFilePath });

    const activity = `${EXPO_GO_APP_ID_ANDROID}/.LauncherActivity`;
    console.log(`Launching Expo Go activity ${chalk.blue(activity)}...`);

    await AndroidDevice.startActivityAsync({
      device,
      activity,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(chalk.red(`Unable to install Expo Go: ${error.message}`));
    }
  } finally {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  }
}

async function downloadExpoGoAsync({
  downloadUrl,
  targetDir,
}: {
  downloadUrl: string;
  targetDir: string;
}): Promise<string> {
  const downloadFilePath = path.join(targetDir, path.basename(downloadUrl));
  await fs.promises.rm(downloadFilePath, { force: true });
  const stream = fs.createWriteStream(downloadFilePath);
  const resp = await fetch(downloadUrl);
  if (!resp.ok || !resp.body) {
    throw new Error(`Failed to download Expo Go from ${downloadUrl}`);
  }
  await resp.body.pipeTo(Writable.toWeb(stream));
  return downloadFilePath;
}

async function action(options: ActionOptions) {
  const platform = options.platform || (await askForPlatformAsync());
  const sdkVersion =
    options.sdkVersion ||
    (await askForSDKVersionAsync(platform, await getNewestSDKVersionAsync(platform)));

  if (!sdkVersion) {
    throw new Error(`Unable to find SDK version. Try to use ${chalk.yellow('--sdkVersion')} flag.`);
  }
  const versionsApiHost = options.production
    ? Versions.VersionsApiHost.PRODUCTION
    : Versions.VersionsApiHost.STAGING;

  const versions = await Versions.getVersionsAsync(versionsApiHost);
  const sdkConfiguration = versions?.sdkVersions?.[sdkVersion];

  if (!sdkConfiguration) {
    throw new Error(`Versions configuration for SDK ${chalk.cyan(sdkVersion)} not found!`);
  }

  const tarballKey = `${platform}ClientUrl`;
  const downloadUrl = sdkConfiguration[tarballKey];

  if (!downloadUrl) {
    throw new Error(
      `Expo Go download url not found at ${chalk.yellow(tarballKey)} key of versions config!`
    );
  }

  switch (platform) {
    case 'ios': {
      await downloadAndInstallOnIOSAsync(downloadUrl);
      break;
    }
    case 'android': {
      await downloadAndInstallOnAndroidAsync(downloadUrl);
      break;
    }
    default: {
      throw new Error(`Platform "${platform}" not implemented!`);
    }
  }

  console.log(chalk.green(`Successfully installed and launched Expo Go 🎉`));
}

export default (program: Command) => {
  program
    .command('client-install')
    .alias('ci')
    .description(
      'Installs specific SDK version of the Expo Go on iOS simulator, Android emulator or connected Android device.'
    )
    .option('-p, --platform [string]', 'Platform for which the Expo Go will be installed.')
    .option('-s, --sdkVersion [string]', 'SDK version of the Expo Go to install.')
    .option('--production', 'Install Expo Go from production endpoint.')
    .asyncAction(action);
};
