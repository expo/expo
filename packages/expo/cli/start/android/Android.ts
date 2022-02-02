import { getConfig, readExpRcAsync } from '@expo/config';
import { AndroidConfig } from '@expo/config-plugins';
import spawnAsync from '@expo/spawn-async';
import assert from 'assert';
import chalk from 'chalk';
import child_process from 'child_process';
import os from 'os';
import semver from 'semver';

import * as Log from '../../log';
import { logEvent } from '../../utils/analytics/rudderstackClient';
import { AbortCommandError, CommandError } from '../../utils/errors';
import { learnMore } from '../../utils/link';
import { confirmAsync } from '../../utils/prompts';
import * as Versions from '../api/Versions';
import { getNativeDevServerPort } from '../devServer';
import * as UrlUtils from '../serverUrl';
import { isDevClientPackageInstalled } from '../startAsync';
import * as WebpackDevServer from '../webpack/WebpackDevServer';
import { activateEmulatorWindowAsync } from './activateEmulatorWindowAsync';
import * as AndroidDeviceBridge from './AndroidDeviceBridge';
import {
  installExpoAsync,
  isAndroidExpoGoInstalledAsync,
  uninstallExpoAsync,
} from './installAndroidExpoGoAsync';
import { promptForDeviceAsync } from './promptAndroidDeviceAsync';

const EMULATOR_MAX_WAIT_TIMEOUT = 60 * 1000 * 3;

function whichEmulator(): string {
  if (process.env.ANDROID_HOME) {
    return `${process.env.ANDROID_HOME}/emulator/emulator`;
  }
  return 'emulator';
}

/**
 * Returns a list of emulator names.
 */
async function getEmulatorsAsync(): Promise<AndroidDeviceBridge.Device[]> {
  try {
    const { stdout } = await spawnAsync(whichEmulator(), ['-list-avds']);
    return stdout
      .split(os.EOL)
      .filter(Boolean)
      .map((name) => ({
        name,
        type: 'emulator',
        // unsure from this
        isBooted: false,
        isAuthorized: true,
      }));
  } catch {
    return [];
  }
}

export async function getAllAvailableDevicesAsync(): Promise<AndroidDeviceBridge.Device[]> {
  const bootedDevices = await AndroidDeviceBridge.getAttachedDevicesAsync();

  const data = await getEmulatorsAsync();
  const connectedNames = bootedDevices.map(({ name }) => name);

  const offlineEmulators = data
    .filter(({ name }) => !connectedNames.includes(name))
    .map(({ name, type }) => {
      return {
        name,
        type,
        isBooted: false,
        // TODO: Are emulators always authorized?
        isAuthorized: true,
      };
    });

  const allDevices = bootedDevices.concat(offlineEmulators);

  if (!allDevices.length) {
    const genymotionMessage = `https://developer.android.com/studio/run/device.html#developer-device-options. If you are using Genymotion go to Settings -> ADB, select "Use custom Android SDK tools", and point it at your Android SDK directory.`;
    throw new Error(
      `No Android connected device found, and no emulators could be started automatically.\nPlease connect a device or create an emulator (https://docs.expo.dev/workflow/android-studio-emulator).\nThen follow the instructions here to enable USB debugging:\n${genymotionMessage}`
    );
  }

  return allDevices;
}

async function startEmulatorAsync(
  device: Pick<AndroidDeviceBridge.Device, 'name'>
): Promise<AndroidDeviceBridge.Device> {
  Log.log(`\u203A Opening emulator ${chalk.bold(device.name)}`);

  // Start a process to open an emulator
  const emulatorProcess = child_process.spawn(
    whichEmulator(),
    [
      `@${device.name}`,
      // disable animation for faster boot -- this might make it harder to detect if it mounted properly tho
      //'-no-boot-anim'
      // '-google-maps-key' -- TODO: Use from config
    ],
    {
      stdio: 'ignore',
      detached: true,
    }
  );

  emulatorProcess.unref();

  return new Promise<AndroidDeviceBridge.Device>((resolve, reject) => {
    const waitTimer = setInterval(async () => {
      const bootedDevices = await AndroidDeviceBridge.getAttachedDevicesAsync();
      const connected = bootedDevices.find(({ name }) => name === device.name);
      if (connected) {
        const isBooted = await AndroidDeviceBridge.isBootAnimationCompleteAsync(connected.pid);
        if (isBooted) {
          stopWaiting();
          resolve(connected);
        }
      }
    }, 1000);

    // Reject command after timeout
    const maxTimer = setTimeout(() => {
      const manualCommand = `${whichEmulator()} @${device.name}`;
      stopWaitingAndReject(
        `It took too long to start the Android emulator: ${device.name}. You can try starting the emulator manually from the terminal with: ${manualCommand}`
      );
    }, EMULATOR_MAX_WAIT_TIMEOUT);

    const stopWaiting = () => {
      clearTimeout(maxTimer);
      clearInterval(waitTimer);
    };

    const stopWaitingAndReject = (message: string) => {
      stopWaiting();
      reject(new Error(message));
      clearInterval(waitTimer);
    };

    emulatorProcess.on('error', ({ message }) => stopWaitingAndReject(message));

    emulatorProcess.on('exit', () => {
      const manualCommand = `${whichEmulator()} @${device.name}`;
      stopWaitingAndReject(
        `The emulator (${device.name}) quit before it finished opening. You can try starting the emulator manually from the terminal with: ${manualCommand}`
      );
    });
  });
}

async function _isDeviceAuthorizedAsync(device: AndroidDeviceBridge.Device): Promise<boolean> {
  // TODO: Get the latest version of the device in case isAuthorized changes.
  return device.isAuthorized;
}

async function ensureDevClientInstalledAsync(
  device: AndroidDeviceBridge.Device,
  applicationId: string
): Promise<void> {
  if (!(await AndroidDeviceBridge.isPackageInstalledAsync(device, applicationId))) {
    throw new CommandError(
      `The development client (${applicationId}) for this project is not installed. ` +
        `Please build and install the client on the device first.\n${learnMore(
          'https://docs.expo.dev/clients/distribution-for-android/'
        )}`
    );
  }
}

async function getExpoVersionAsync(device: AndroidDeviceBridge.Device): Promise<string | null> {
  const info = await AndroidDeviceBridge.getPackageInfoAsync(device, {
    packageName: 'host.exp.exponent',
  });

  const regex = /versionName=([0-9.]+)/;
  const regexMatch = regex.exec(info);
  if (!regexMatch || regexMatch.length < 2) {
    return null;
  }

  return regexMatch[1];
}

async function isClientOutdatedAsync(
  device: AndroidDeviceBridge.Device,
  sdkVersion?: string
): Promise<boolean> {
  const versions = await Versions.getVersionsAsync();
  const clientForSdk = await getClientForSDK(sdkVersion);
  const latestVersionForSdk = clientForSdk?.version ?? versions.androidVersion;
  const installedVersion = await getExpoVersionAsync(device);
  return !installedVersion || semver.lt(installedVersion, latestVersionForSdk);
}

async function _openUrlAsync({
  pid,
  url,
  applicationId,
}: {
  pid: string;
  url: string;
  applicationId: string;
}) {
  // NOTE(brentvatne): temporary workaround! launch Expo Go first, then
  // launch the project!
  // https://github.com/expo/expo/issues/7772
  // adb shell monkey -p host.exp.exponent -c android.intent.category.LAUNCHER 1
  // Note: this is not needed in Expo Development Client, it only applies to Expo Go
  if (applicationId === 'host.exp.exponent') {
    await AndroidDeviceBridge.launchApplicationIdAsync({ pid }, { applicationId });
  }

  return await AndroidDeviceBridge.launchUrlAsync({ pid }, { url });
}

/**
 * @param device Android device to open on
 * @param props.launchActivity Activity to launch `[application identifier]/.[main activity name]`, ex: `com.bacon.app/.MainActivity`
 */
export async function openAppAsync(
  device: Pick<AndroidDeviceBridge.Device, 'pid' | 'type'>,
  {
    launchActivity,
  }: {
    launchActivity: string;
  }
) {
  const openProject = await AndroidDeviceBridge.launchActivityAsync(device, { launchActivity });

  await activateEmulatorWindowAsync(device);

  return openProject;
}

export async function attemptToStartEmulatorOrAssertAsync(
  device: AndroidDeviceBridge.Device
): Promise<AndroidDeviceBridge.Device | null> {
  // TODO: Add a light-weight method for checking since a device could disconnect.

  if (!(await AndroidDeviceBridge.isDeviceBootedAsync(device))) {
    device = await startEmulatorAsync(device);
  }

  if (!(await _isDeviceAuthorizedAsync(device))) {
    AndroidDeviceBridge.logUnauthorized(device);
    return null;
  }

  return device;
}

// Keep a list of simulator UDIDs so we can prevent asking multiple times if a user wants to upgrade.
// This can prevent annoying interactions when they don't want to upgrade for whatever reason.
const hasPromptedToUpgrade: Record<string, boolean> = {};

async function isManagedProjectAsync(projectRoot: string) {
  try {
    await AndroidConfig.Paths.getProjectPathOrThrowAsync(projectRoot);
    return false;
  } catch {
    return true;
  }
}

async function getClientForSDK(sdkVersionString?: string) {
  if (!sdkVersionString) {
    return null;
  }

  const sdkVersion = (await Versions.getVersionsAsync())[sdkVersionString];
  if (!sdkVersion) {
    return null;
  }

  return {
    url: sdkVersion.androidClientUrl,
    version: sdkVersion.androidClientVersion,
  };
}

export async function resolveApplicationIdAsync(projectRoot: string): Promise<string | null> {
  try {
    const applicationIdFromGradle = await AndroidConfig.Package.getApplicationIdAsync(projectRoot);
    if (applicationIdFromGradle) {
      return applicationIdFromGradle;
    }
  } catch {}

  try {
    const filePath = await AndroidConfig.Paths.getAndroidManifestAsync(projectRoot);
    const androidManifest = await AndroidConfig.Manifest.readAndroidManifestAsync(filePath);
    // Assert MainActivity defined.
    await AndroidConfig.Manifest.getMainActivityOrThrow(androidManifest);
    if (androidManifest.manifest?.$?.package) {
      return androidManifest.manifest.$.package;
    }
  } catch {}

  return getConfig(projectRoot).exp.android?.package ?? null;
}

function constructDeepLink(
  projectRoot: string,
  scheme?: string,
  devClient?: boolean
): string | null {
  if (
    process.env['EXPO_ENABLE_INTERSTITIAL_PAGE'] &&
    !devClient &&
    isDevClientPackageInstalled(projectRoot)
  ) {
    return UrlUtils.constructLoadingUrl('android');
  } else {
    try {
      return UrlUtils.constructDeepLink({
        scheme,
      });
    } catch (e) {
      if (devClient) {
        return null;
      }
      throw e;
    }
  }
}
export async function openProjectInDevClientAsync(
  projectRoot: string,
  {
    shouldPrompt,
    device,
    scheme,
    applicationId,
    launchActivity,
  }: {
    shouldPrompt?: boolean;
    device?: AndroidDeviceBridge.Device;
    scheme?: string;
    applicationId?: string | null;
    launchActivity?: string;
  } = {}
): Promise<{ url: string }> {
  await startAdbReverseAsync(projectRoot);

  const projectUrl = constructDeepLink(projectRoot, scheme, true);

  const { exp } = getConfig(projectRoot);

  // Resolve device
  if (device) {
    const booted = await attemptToStartEmulatorOrAssertAsync(device);
    if (!booted) {
      throw new AbortCommandError();
    }
    device = booted;
  } else {
    const devices = await getAllAvailableDevicesAsync();
    device = shouldPrompt ? await promptForDeviceAsync(devices) : devices[0];
  }

  // No URL, and is devClient
  if (!projectUrl) {
    if (!launchActivity) {
      applicationId = applicationId ?? (await resolveApplicationIdAsync(projectRoot));
      assert(
        applicationId,
        'Cannot resolve application identifier or URI scheme to open the native Android app.\nBuild the native app with `expo run:android` or `eas build -p android`'
      );

      launchActivity = `${applicationId}/.MainActivity`;
    }

    try {
      await openAppAsync(device, {
        launchActivity,
      });
    } catch (error) {
      let errorMessage = `Couldn't open Android app with activity "${launchActivity}" on device "${device.name}".`;
      if (error instanceof CommandError && error.code === 'APP_NOT_INSTALLED') {
        errorMessage += `\nThe app might not be installed, try installing it with: ${chalk.bold(
          `expo run:android -d ${device.name}`
        )}`;
      }
      errorMessage += chalk.gray(`\n${error.message}`);
      error.message = errorMessage;
      throw error;
    }
    return {
      // TODO: Remove this hack
      url: '',
    };
  }

  const bootedDevice = await attemptToStartEmulatorOrAssertAsync(device);
  if (!bootedDevice) {
    return;
  }
  Log.log(`\u203A Opening ${chalk.underline(projectUrl)} on ${chalk.bold(bootedDevice.name)}`);

  await activateEmulatorWindowAsync(bootedDevice);

  device = bootedDevice;

  const isManaged = await isManagedProjectAsync(projectRoot);
  if (isManaged) {
    applicationId = exp?.android?.package;
    if (!applicationId) {
      throw new CommandError(
        `Could not find property android.package in app.config.js/app.json. This setting is required to launch the app.`
      );
    }
  } else {
    applicationId = await resolveApplicationIdAsync(projectRoot);
    if (!applicationId) {
      throw new CommandError(
        `Could not find applicationId in ${AndroidConfig.Paths.getAppBuildGradleFilePath(
          projectRoot
        )}`
      );
    }
  }
  await ensureDevClientInstalledAsync(device, applicationId);

  try {
    await _openUrlAsync({ pid: device.pid!, url: projectUrl, applicationId });
  } catch (e) {
    e.message = `Error running app. ${e.message}`;
    throw e;
  }

  if (device.type === 'emulator') {
    // TODO: Bring the emulator window to the front.
  }

  logEvent('Open Url on Device', {
    platform: 'android',
    installedExpo: false,
  });
}

export async function openProjectInExpoGoAsync(
  projectRoot: string,
  {
    shouldPrompt,
    device,
  }: {
    shouldPrompt?: boolean;
    device?: AndroidDeviceBridge.Device;
  } = {}
): Promise<{ url: string }> {
  await startAdbReverseAsync(projectRoot);

  const projectUrl = constructDeepLink(projectRoot);

  const { exp } = getConfig(projectRoot);

  // Resolve device
  if (!device) {
    const devices = await getAllAvailableDevicesAsync();
    device = shouldPrompt ? await promptForDeviceAsync(devices) : devices[0];
  }

  const bootedDevice = await attemptToStartEmulatorOrAssertAsync(device);
  if (!bootedDevice) {
    throw new AbortCommandError();
  }
  Log.log(`\u203A Opening ${chalk.underline(projectUrl)} on ${chalk.bold(bootedDevice.name)}`);

  await activateEmulatorWindowAsync(bootedDevice);

  let installedExpo = false;
  const clientApplicationId = 'host.exp.exponent';

  let shouldInstall = !(await isAndroidExpoGoInstalledAsync(bootedDevice));
  const promptKey = bootedDevice.pid ?? 'unknown';
  if (
    !shouldInstall &&
    !hasPromptedToUpgrade[promptKey] &&
    (await isClientOutdatedAsync(bootedDevice, exp.sdkVersion))
  ) {
    // Only prompt once per device, per run.
    hasPromptedToUpgrade[promptKey] = true;
    const confirm = await confirmAsync({
      initial: true,
      message: `Expo Go on ${bootedDevice.name} (${bootedDevice.type}) is outdated, would you like to upgrade?`,
    });
    if (confirm) {
      await uninstallExpoAsync(bootedDevice);
      shouldInstall = true;
    }
  }

  if (shouldInstall) {
    const androidClient = await getClientForSDK(exp.sdkVersion);
    await installExpoAsync({ device: bootedDevice, ...androidClient });
    installedExpo = true;
  }
  // _checkExpoUpToDateAsync(); // let this run in background

  await _openUrlAsync({
    pid: bootedDevice.pid!,
    url: projectUrl,
    applicationId: clientApplicationId,
  });

  logEvent('Open Url on Device', {
    platform: 'android',
    installedExpo,
  });

  return { url: projectUrl };
}

/** Open the current web project (Webpack) in an Emulator. */
export async function openWebProjectAsync(
  projectRoot: string,
  {
    shouldPrompt,
  }: {
    /** Should prompt the user to select an Android device. */
    shouldPrompt?: boolean;
  } = {}
): Promise<{ url: string }> {
  // Ensure Webpack Dev Server is running.
  const url = WebpackDevServer.getDevServerUrl();
  assert(url, 'Webpack Dev Server is not running.');

  // Start ADB reverse.
  await startAdbReverseAsync(projectRoot);

  // Resolve device.
  const devices = await getAllAvailableDevicesAsync();
  const device = shouldPrompt ? await promptForDeviceAsync(devices) : devices[0];
  // Boot resolved device.
  const bootedDevice = await attemptToStartEmulatorOrAssertAsync(device);
  assert(bootedDevice, `Failed to boot emulator.`);

  Log.log(chalk`\u203A Opening {underline ${url}} on {bold ${bootedDevice.name}}`);

  // Bring the emulator window to the front on macos devices.
  await activateEmulatorWindowAsync(bootedDevice);

  // Launch the web url (http or https) in the emulator.
  await AndroidDeviceBridge.launchUrlAsync(bootedDevice, { url });

  return { url };
}

// Adb reverse
async function getAdbReversePortsAsync(projectRoot: string): Promise<number[]> {
  // Is .exprc still supported?
  const expRc = await readExpRcAsync(projectRoot);
  const userDefinedAdbReversePorts = expRc.extraAdbReversePorts || [];

  return [getNativeDevServerPort(), ...userDefinedAdbReversePorts].filter(Boolean);
}

export async function startAdbReverseAsync(projectRoot: string): Promise<boolean> {
  const adbReversePorts = await getAdbReversePortsAsync(projectRoot);
  return AndroidDeviceBridge.startAdbReverseAsync(adbReversePorts);
}

export async function stopAdbReverseAsync(projectRoot: string): Promise<void> {
  const adbReversePorts = await getAdbReversePortsAsync(projectRoot);
  return AndroidDeviceBridge.stopAdbReverseAsync(adbReversePorts);
}
