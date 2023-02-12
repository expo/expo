import { Command } from '@expo/commander';
import spawnAsync from '@expo/spawn-async';
import { Android, Config, Simulator, Versions } from '@expo/xdl';
import chalk from 'chalk';

import { STAGING_API_HOST } from '../Constants';
import { Platform, getNewestSDKVersionAsync } from '../ProjectVersions';
import askForPlatformAsync from '../utils/askForPlatformAsync';
import askForSDKVersionAsync from '../utils/askForSDKVersionAsync';

type ActionOptions = {
  platform?: Platform;
  sdkVersion?: string;
};

async function downloadAndInstallOnIOSAsync(clientUrl: string): Promise<void> {
  if (!(await Simulator.isSimulatorInstalledAsync())) {
    console.error(chalk.red('iOS simulator is not installed!'));
    return;
  }

  console.log('Booting up iOS simulator...');

  const simulator = await Simulator.ensureSimulatorOpenAsync();

  console.log('Uninstalling previously installed Expo client...');

  await Simulator.uninstallExpoAppFromSimulatorAsync(simulator);

  console.log(`Installing Expo client from ${chalk.blue(clientUrl)} on iOS simulator...`);

  const installResult = await Simulator.installExpoOnSimulatorAsync({ url: clientUrl, simulator });

  if (installResult.status !== 0) {
    throw new Error('Installing Expo client simulator failed!');
  }

  const appIdentifier = 'host.exp.Exponent';

  console.log(`Launching Expo client with identifier ${chalk.blue(appIdentifier)}...`);

  await spawnAsync('xcrun', ['simctl', 'launch', 'booted', appIdentifier]);
}

async function downloadAndInstallOnAndroidAsync(clientUrl: string): Promise<void> {
  try {
    console.log('Checking if the are any Android devices or emulators connected...');

    const devices = await Android.getAttachedDevicesAsync();
    if (devices.length === 0) {
      throw new Error('No connected devices or emulators found.');
    }

    const device = devices[0];
    if (devices.length > 1) {
      console.log(
        `More than one Android device found. Installing on the first one found, ${device.name}.`
      );
    }

    if (!device.isAuthorized) {
      throw new Error(
        `This computer is not authorized for developing on ${device.name}. See https://expo.fyi/authorize-android-device.`
      );
    }

    console.log('Uninstalling previously installed Expo client...');

    await Android.uninstallExpoAsync(device);

    console.log(
      `Installing Expo client from ${chalk.blue(clientUrl)} on Android ${device.type}...`
    );

    await Android.installExpoAsync({ url: clientUrl, device });

    console.log('Launching application...');

    await Android.getAdbOutputAsync([
      'shell',
      'am',
      'start',
      '-n',
      `host.exp.exponent/.LauncherActivity`,
    ]);
  } catch (error) {
    console.error(chalk.red(`Unable to install Expo client: ${error.message}`));
  }
}

async function action(options: ActionOptions) {
  const platform = options.platform || (await askForPlatformAsync());
  const sdkVersion =
    options.sdkVersion ||
    (await askForSDKVersionAsync(platform, await getNewestSDKVersionAsync(platform)));

  if (!sdkVersion) {
    throw new Error(`Unable to find SDK version. Try to use ${chalk.yellow('--sdkVersion')} flag.`);
  }

  // Set XDL config to use staging
  Config.api.host = STAGING_API_HOST;

  const versions = await Versions.versionsAsync();
  const sdkConfiguration = versions?.sdkVersions?.[sdkVersion];

  if (!sdkConfiguration) {
    throw new Error(`Versions configuration for SDK ${chalk.cyan(sdkVersion)} not found!`);
  }

  const tarballKey = `${platform}ClientUrl`;
  const clientUrl = sdkConfiguration[tarballKey];

  if (!clientUrl) {
    throw new Error(`Client url not found at ${chalk.yellow(tarballKey)} key of versions config!`);
  }

  switch (platform) {
    case 'ios': {
      await downloadAndInstallOnIOSAsync(clientUrl);
      break;
    }
    case 'android': {
      await downloadAndInstallOnAndroidAsync(clientUrl);
      break;
    }
    default: {
      throw new Error(`Platform "${platform}" not implemented!`);
    }
  }
  console.log(chalk.green('Successfully installed and launched staging version of the client 🎉'));
}

export default (program: Command) => {
  program
    .command('client-install')
    .alias('ci')
    .description(
      'Installs staging version of the client on iOS simulator, Android emulator or connected Android device.'
    )
    .option('-p, --platform [string]', 'Platform for which the client will be installed.')
    .option('-s, --sdkVersion [string]', 'SDK version of the client to install.')
    .asyncAction(action);
};
