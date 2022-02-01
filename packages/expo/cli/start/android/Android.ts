import { ExpoConfig, getConfig, readExpRcAsync } from '@expo/config';
import { AndroidConfig } from '@expo/config-plugins';
import * as osascript from '@expo/osascript';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import child_process, { execFileSync } from 'child_process';
import os from 'os';
import ProgressBar from 'progress';
import semver from 'semver';

import * as Log from '../../log';
import { logEvent } from '../../utils/analytics/rudderstackClient';
import { downloadApkAsync } from '../../utils/downloadAppAsync';
import { CommandError } from '../../utils/errors';
import { learnMore } from '../../utils/link';
import { logNewSection } from '../../utils/ora';
import { setProgressBar } from '../../utils/progress';
import { confirmAsync, promptAsync } from '../../utils/prompts';
import * as Binaries from '../../utils/vendoredBinary';
import * as Versions from '../api/Versions';
import { getNativeDevServerPort } from '../devServer';
import * as UrlUtils from '../serverUrl';
import { isDevClientPackageInstalled } from '../startAsync';
import * as WebpackDevServer from '../webpack/WebpackDevServer';

export type Device = {
  pid?: string;
  name: string;
  type: 'emulator' | 'device';
  isBooted: boolean;
  isAuthorized: boolean;
};

let _lastUrl: string | null = null;
let _isAdbOwner: boolean | null = null;

const BEGINNING_OF_ADB_ERROR_MESSAGE = 'error: ';
const CANT_START_ACTIVITY_ERROR = 'Activity not started, unable to resolve Intent';

const INSTALL_WARNING_TIMEOUT = 60 * 1000;

const EMULATOR_MAX_WAIT_TIMEOUT = 60 * 1000 * 3;

function whichEmulator(): string {
  if (process.env.ANDROID_HOME) {
    return `${process.env.ANDROID_HOME}/emulator/emulator`;
  }
  return 'emulator';
}

function whichADB(): string {
  if (process.env.ANDROID_HOME) {
    return `${process.env.ANDROID_HOME}/platform-tools/adb`;
  }
  return 'adb';
}

/**
 * Returns a list of emulator names.
 */
async function getEmulatorsAsync(): Promise<Device[]> {
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

/**
 * Return the Emulator name for an emulator ID, this can be used to determine if an emulator is booted.
 *
 * @param emulatorId a value like `emulator-5554` from `abd devices`
 */
async function getAbdNameForEmulatorIdAsync(emulatorId: string): Promise<string | null> {
  return (
    (await getAdbOutputAsync(['-s', emulatorId, 'emu', 'avd', 'name']))
      .trim()
      .split(/\r?\n/)
      .shift() ?? null
  );
}

export async function getAllAvailableDevicesAsync(): Promise<Device[]> {
  const bootedDevices = await getAttachedDevicesAsync();

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

/**
 * Returns true when a device's splash screen animation has stopped.
 * This can be used to detect when a device is fully booted and ready to use.
 *
 * @param pid
 */
async function isBootAnimationCompleteAsync(pid?: string): Promise<boolean> {
  try {
    const props = await getPropertyDataForDeviceAsync({ pid }, PROP_BOOT_ANIMATION_STATE);
    return !!props[PROP_BOOT_ANIMATION_STATE].match(/stopped/);
  } catch {
    return false;
  }
}

async function startEmulatorAsync(device: Pick<Device, 'name'>): Promise<Device> {
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

  return new Promise<Device>((resolve, reject) => {
    const waitTimer = setInterval(async () => {
      const bootedDevices = await getAttachedDevicesAsync();
      const connected = bootedDevices.find(({ name }) => name === device.name);
      if (connected) {
        const isBooted = await isBootAnimationCompleteAsync(connected.pid);
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

// TODO: This is very expensive for some operations.
export async function getAttachedDevicesAsync(): Promise<Device[]> {
  const output = await getAdbOutputAsync(['devices', '-l']);

  const splitItems = output.trim().replace(/\n$/, '').split(os.EOL);
  // First line is `"List of devices attached"`, remove it
  // @ts-ignore: todo
  const attachedDevices: {
    props: string[];
    type: Device['type'];
    isAuthorized: Device['isAuthorized'];
  }[] = splitItems
    .slice(1, splitItems.length)
    .map((line) => {
      // unauthorized: ['FA8251A00719', 'unauthorized', 'usb:338690048X', 'transport_id:5']
      // authorized: ['FA8251A00719', 'device', 'usb:336592896X', 'product:walleye', 'model:Pixel_2', 'device:walleye', 'transport_id:4']
      // emulator: ['emulator-5554', 'offline', 'transport_id:1']
      const props = line.split(' ').filter(Boolean);

      const isAuthorized = props[1] !== 'unauthorized';
      const type = line.includes('emulator') ? 'emulator' : 'device';
      return { props, type, isAuthorized };
    })
    .filter(({ props: [pid] }) => !!pid);

  const devicePromises = attachedDevices.map<Promise<Device>>(async (props) => {
    const {
      type,
      props: [pid, ...deviceInfo],
      isAuthorized,
    } = props;

    let name: string | null = null;

    if (type === 'device') {
      if (isAuthorized) {
        // Possibly formatted like `model:Pixel_2`
        // Transform to `Pixel_2`
        const modelItem = deviceInfo.find((info) => info.includes('model:'));
        if (modelItem) {
          name = modelItem.replace('model:', '');
        }
      }
      // unauthorized devices don't have a name available to read
      if (!name) {
        // Device FA8251A00719
        name = `Device ${pid}`;
      }
    } else {
      // Given an emulator pid, get the emulator name which can be used to start the emulator later.
      name = (await getAbdNameForEmulatorIdAsync(pid)) ?? '';
    }

    return {
      pid,
      name,
      type,
      isAuthorized,
      isBooted: true,
    };
  });

  return Promise.all(devicePromises);
}

export function isPlatformSupported(): boolean {
  return (
    process.platform === 'darwin' || process.platform === 'win32' || process.platform === 'linux'
  );
}

async function adbAlreadyRunning(adb: string): Promise<boolean> {
  try {
    const result = await spawnAsync(adb, ['start-server']);
    const lines = result.stderr.trim().split(/\r?\n/);
    return lines.includes('* daemon started successfully') === false;
  } catch (e) {
    let errorMessage = (e.stderr || e.stdout).trim();
    if (errorMessage.startsWith(BEGINNING_OF_ADB_ERROR_MESSAGE)) {
      errorMessage = errorMessage.substring(BEGINNING_OF_ADB_ERROR_MESSAGE.length);
    }
    e.message = errorMessage;
    throw e;
  }
}

export async function getAdbOutputAsync(args: string[]): Promise<string> {
  await Binaries.addToPathAsync('adb');
  const adb = whichADB();

  if (_isAdbOwner === null) {
    const alreadyRunning = await adbAlreadyRunning(adb);
    _isAdbOwner = alreadyRunning === false;
  }

  Log.debug([adb, ...args].join(' '));
  try {
    const result = await spawnAsync(adb, args);
    return result.output.join('\n');
  } catch (e) {
    // User pressed ctrl+c to cancel the process...
    if (e.signal === 'SIGINT') {
      e.isAbortError = true;
    }
    // TODO: Support heap corruption for adb 29 (process exits with code -1073740940) (windows and linux)
    let errorMessage = (e.stderr || e.stdout || e.message).trim();
    if (errorMessage.startsWith(BEGINNING_OF_ADB_ERROR_MESSAGE)) {
      errorMessage = errorMessage.substring(BEGINNING_OF_ADB_ERROR_MESSAGE.length);
    }
    e.message = errorMessage;
    throw e;
  }
}

export async function getAdbFileOutputAsync(args: string[], encoding?: 'latin1') {
  await Binaries.addToPathAsync('adb');
  const adb = whichADB();

  if (_isAdbOwner === null) {
    const alreadyRunning = await adbAlreadyRunning(adb);
    _isAdbOwner = alreadyRunning === false;
  }

  try {
    return await execFileSync(adb, args, {
      encoding,
      stdio: 'pipe',
    });
  } catch (e) {
    let errorMessage = (e.stderr || e.stdout || e.message).trim();
    if (errorMessage.startsWith(BEGINNING_OF_ADB_ERROR_MESSAGE)) {
      errorMessage = errorMessage.substring(BEGINNING_OF_ADB_ERROR_MESSAGE.length);
    }
    e.message = errorMessage;
    throw e;
  }
}

async function _isDeviceAuthorizedAsync(device: Device): Promise<boolean> {
  // TODO: Get the latest version of the device in case isAuthorized changes.
  return device.isAuthorized;
}

async function isInstalledAsync(device: Device, androidPackage: string): Promise<boolean> {
  const packages = await getAdbOutputAsync(
    adbPidArgs(device.pid, 'shell', 'pm', 'list', 'packages', androidPackage)
  );

  const lines = packages.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === `package:${androidPackage}`) {
      return true;
    }
  }
  return false;
}

// Expo installed
async function _isExpoInstalledAsync(device: Device) {
  return await isInstalledAsync(device, 'host.exp.exponent');
}

async function ensureDevClientInstalledAsync(device: Device, applicationId: string): Promise<void> {
  if (!(await isInstalledAsync(device, applicationId))) {
    throw new Error(
      `The development client (${applicationId}) for this project is not installed. ` +
        `Please build and install the client on the device first.\n${learnMore(
          'https://docs.expo.dev/clients/distribution-for-android/'
        )}`
    );
  }
}

async function getExpoVersionAsync(device: Device): Promise<string | null> {
  const info = await getAdbOutputAsync(
    adbPidArgs(device.pid, 'shell', 'dumpsys', 'package', 'host.exp.exponent')
  );

  const regex = /versionName=([0-9.]+)/;
  const regexMatch = regex.exec(info);
  if (!regexMatch || regexMatch.length < 2) {
    return null;
  }

  return regexMatch[1];
}

async function isClientOutdatedAsync(device: Device, sdkVersion?: string): Promise<boolean> {
  const versions = await Versions.getVersionsAsync();
  const clientForSdk = await getClientForSDK(sdkVersion);
  const latestVersionForSdk = clientForSdk?.version ?? versions.androidVersion;
  const installedVersion = await getExpoVersionAsync(device);
  return !installedVersion || semver.lt(installedVersion, latestVersionForSdk);
}

export async function installExpoAsync({
  device,
  url,
  version,
}: {
  device: Device;
  url?: string;
  version?: string;
}) {
  let warningTimer: NodeJS.Timeout;
  const setWarningTimer = () => {
    if (warningTimer) {
      clearTimeout(warningTimer);
    }
    return setTimeout(() => {
      Log.log('');
      Log.log(
        'This download is taking longer than expected. You can also try downloading the clients from the website at https://expo.dev/tools'
      );
    }, INSTALL_WARNING_TIMEOUT);
  };

  const bar = new ProgressBar('Downloading the Expo Go app [:bar] :percent :etas', {
    width: 64,
    total: 100,
    clear: true,
    complete: '=',
    incomplete: ' ',
  });
  // TODO: Auto track progress bars
  setProgressBar(bar);

  warningTimer = setWarningTimer();
  const path = await downloadApkAsync(url, (progress) => {
    if (bar) {
      bar.tick(1, progress);
    }
  });

  bar.terminate();
  setProgressBar(null);

  const message = version
    ? `Installing Expo Go ${version} on ${device.name}`
    : `Installing Expo Go on ${device.name}`;

  const ora = logNewSection(message);

  warningTimer = setWarningTimer();
  const result = await installOnDeviceAsync(device, { binaryPath: path });
  ora.stop();

  clearTimeout(warningTimer);
  return result;
}

export async function installOnDeviceAsync(
  device: Pick<Device, 'pid'>,
  { binaryPath }: { binaryPath: string }
) {
  return await getAdbOutputAsync(adbPidArgs(device.pid, 'install', '-r', '-d', binaryPath));
}

export async function isDeviceBootedAsync({
  name,
}: { name?: string } = {}): Promise<Device | null> {
  const devices = await getAttachedDevicesAsync();

  if (!name) {
    return devices[0] ?? null;
  }

  return devices.find((device) => device.name === name) ?? null;
}

export async function uninstallExpoAsync(device: Device): Promise<string | undefined> {
  Log.log('Uninstalling Expo Go from Android device.');

  // we need to check if its installed, else we might bump into "Failure [DELETE_FAILED_INTERNAL_ERROR]"
  const isInstalled = await _isExpoInstalledAsync(device);
  if (!isInstalled) {
    return;
  }

  try {
    return await getAdbOutputAsync(adbPidArgs(device.pid, 'uninstall', 'host.exp.exponent'));
  } catch (e) {
    Log.error(
      'Could not uninstall Expo Go from your device, please uninstall Expo Go manually and try again.'
    );
    throw e;
  }
}

export async function upgradeExpoAsync({
  url,
  version,
  device,
}: {
  url?: string;
  version?: string;
  device?: Device | null;
} = {}): Promise<boolean> {
  try {
    if (!device) {
      device = (await getAttachedDevicesAsync())[0];
      if (!device) {
        throw new Error('no devices connected');
      }
    }
    device = await attemptToStartEmulatorOrAssertAsync(device);
    if (!device) {
      return false;
    }

    await uninstallExpoAsync(device);
    await installExpoAsync({ device, url, version });
    if (_lastUrl) {
      Log.log(`\u203A Opening ${_lastUrl} in Expo.`);
      await getAdbOutputAsync([
        'shell',
        'am',
        'start',
        '-a',
        'android.intent.action.VIEW',
        '-d',
        _lastUrl,
      ]);
      _lastUrl = null;
    }

    return true;
  } catch (e) {
    Log.error(e.message);
    return false;
  }
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
    const openClient = await getAdbOutputAsync(
      adbPidArgs(
        pid,
        'shell',
        'monkey',
        '-p',
        applicationId,
        '-c',
        'android.intent.category.LAUNCHER',
        '1'
      )
    );
    if (openClient.includes(CANT_START_ACTIVITY_ERROR)) {
      throw new Error(openClient.substring(openClient.indexOf('Error: ')));
    }
  }

  const openProject = await getAdbOutputAsync(
    adbPidArgs(pid, 'shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', url)
  );
  if (openProject.includes(CANT_START_ACTIVITY_ERROR)) {
    throw new Error(openProject.substring(openProject.indexOf('Error: ')));
  }

  return openProject;
}

function getUnixPID(port: number | string) {
  return execFileSync('lsof', [`-i:${port}`, '-P', '-t', '-sTCP:LISTEN'], {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
  })
    .split('\n')[0]
    .trim();
}

export async function activateEmulatorWindowAsync(device: Pick<Device, 'type' | 'pid'>) {
  if (
    // only mac is supported for now.
    process.platform !== 'darwin' ||
    // can only focus emulators
    device.type !== 'emulator'
  ) {
    return;
  }

  // Google Emulator ID: `emulator-5554` -> `5554`
  const androidPid = device.pid!.match(/-(\d+)/)?.[1];
  if (!androidPid) {
    return;
  }
  // Unix PID
  const pid = getUnixPID(androidPid);

  try {
    await osascript.execAsync(`
  tell application "System Events"
    set frontmost of the first process whose unix id is ${pid} to true
  end tell`);
  } catch {
    // noop -- this feature is very specific and subject to failure.
  }
}

/**
 * @param device Android device to open on
 * @param props.launchActivity Activity to launch `[application identifier]/.[main activity name]`, ex: `com.bacon.app/.MainActivity`
 */
export async function openAppAsync(
  device: Pick<Device, 'pid' | 'type'>,
  {
    launchActivity,
  }: {
    launchActivity: string;
  }
) {
  const openProject = await getAdbOutputAsync(
    adbPidArgs(
      device.pid,
      'shell',
      'am',
      'start',
      '-a',
      'android.intent.action.RUN',
      // FLAG_ACTIVITY_SINGLE_TOP -- If set, the activity will not be launched if it is already running at the top of the history stack.
      '-f',
      '0x20000000',
      // Activity to open first: com.bacon.app/.MainActivity
      '-n',
      launchActivity
    )
  );

  // App is not installed or main activity cannot be found
  if (openProject.match(/Error: Activity class .* does not exist./g)) {
    throw new CommandError(
      'APP_NOT_INSTALLED',
      openProject.substring(openProject.indexOf('Error: '))
    );
  }

  await activateEmulatorWindowAsync(device);

  return openProject;
}

export async function attemptToStartEmulatorOrAssertAsync(device: Device): Promise<Device | null> {
  // TODO: Add a light-weight method for checking since a device could disconnect.

  if (!(await isDeviceBootedAsync(device))) {
    device = await startEmulatorAsync(device);
  }

  if (!(await _isDeviceAuthorizedAsync(device))) {
    logUnauthorized(device);
    return null;
  }

  return device;
}

function logUnauthorized(device: Device) {
  Log.warn(
    `\nThis computer is not authorized for developing on ${chalk.bold(device.name)}. ${chalk.dim(
      learnMore('https://expo.fyi/authorize-android-device')
    )}`
  );
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

async function openUrlAsync({
  url,
  device,
  isDetached = false,
  sdkVersion,
  devClient = false,
  exp,
  projectRoot,
}: {
  url: string;
  isDetached?: boolean;
  device: Device;
  sdkVersion?: string;
  devClient?: boolean;
  exp?: ExpoConfig;
  projectRoot: string;
}): Promise<void> {
  const bootedDevice = await attemptToStartEmulatorOrAssertAsync(device);
  if (!bootedDevice) {
    return;
  }
  Log.log(`\u203A Opening ${chalk.underline(url)} on ${chalk.bold(bootedDevice.name)}`);

  await activateEmulatorWindowAsync(bootedDevice);

  device = bootedDevice;
  let installedExpo = false;
  let clientApplicationId = 'host.exp.exponent';

  try {
    if (devClient) {
      let applicationId;
      const isManaged = await isManagedProjectAsync(projectRoot);
      if (isManaged) {
        applicationId = exp?.android?.package;
        if (!applicationId) {
          throw new Error(
            `Could not find property android.package in app.config.js/app.json. This setting is required to launch the app.`
          );
        }
      } else {
        applicationId = await resolveApplicationIdAsync(projectRoot);
        if (!applicationId) {
          throw new Error(
            `Could not find applicationId in ${AndroidConfig.Paths.getAppBuildGradleFilePath(
              projectRoot
            )}`
          );
        }
      }
      clientApplicationId = applicationId;
      await ensureDevClientInstalledAsync(device, clientApplicationId);
    } else if (!isDetached) {
      let shouldInstall = !(await _isExpoInstalledAsync(device));
      const promptKey = device.pid ?? 'unknown';
      if (
        !shouldInstall &&
        !hasPromptedToUpgrade[promptKey] &&
        (await isClientOutdatedAsync(device, sdkVersion))
      ) {
        // Only prompt once per device, per run.
        hasPromptedToUpgrade[promptKey] = true;
        const confirm = await confirmAsync({
          initial: true,
          message: `Expo Go on ${device.name} (${device.type}) is outdated, would you like to upgrade?`,
        });
        if (confirm) {
          await uninstallExpoAsync(device);
          shouldInstall = true;
        }
      }

      if (shouldInstall) {
        const androidClient = await getClientForSDK(sdkVersion);
        await installExpoAsync({ device, ...androidClient });
        installedExpo = true;
      }

      _lastUrl = url;
      // _checkExpoUpToDateAsync(); // let this run in background
    }

    try {
      await _openUrlAsync({ pid: device.pid!, url, applicationId: clientApplicationId });
    } catch (e) {
      if (isDetached) {
        e.message = `Error running app. Have you installed the app already using Android Studio? Since you are detached you must build manually. ${e.message}`;
      } else {
        e.message = `Error running app. ${e.message}`;
      }

      throw e;
    }

    if (device.type === 'emulator') {
      // TODO: Bring the emulator window to the front.
    }

    logEvent('Open Url on Device', {
      platform: 'android',
      installedExpo,
    });
  } catch (e) {
    e.message = `Error running adb: ${e.message}`;
    throw e;
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

  const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true });
  return exp.android?.package ?? null;
}

async function constructDeepLinkAsync(
  projectRoot: string,
  scheme?: string,
  devClient?: boolean
): Promise<string | null> {
  if (
    process.env['EXPO_ENABLE_INTERSTITIAL_PAGE'] &&
    !devClient &&
    isDevClientPackageInstalled(projectRoot)
  ) {
    return UrlUtils.constructLoadingUrlAsync(projectRoot, 'android');
  } else {
    return await UrlUtils.constructDeepLinkAsync(projectRoot, {
      scheme,
    }).catch((e) => {
      if (devClient) {
        return null;
      }
      throw e;
    });
  }
}

export async function openProjectAsync(
  projectRoot: string,
  {
    shouldPrompt,
    devClient = false,
    device,
    scheme,
    applicationId,
    launchActivity,
  }: {
    shouldPrompt?: boolean;
    devClient?: boolean;
    device?: Device;
    scheme?: string;
    applicationId?: string | null;
    launchActivity?: string;
  }
): Promise<{ success: true; url: string } | { success: false; error: Error | string }> {
  await startAdbReverseAsync(projectRoot);

  const projectUrl = await constructDeepLinkAsync(projectRoot, scheme, devClient);

  const { exp } = getConfig(projectRoot, {
    skipSDKVersionRequirement: true,
  });

  // Resolve device
  if (device) {
    const booted = await attemptToStartEmulatorOrAssertAsync(device);
    if (!booted) {
      return { success: false, error: 'escaped' };
    }
    device = booted;
  } else {
    const devices = await getAllAvailableDevicesAsync();
    let booted: Device | null = devices[0];
    if (shouldPrompt) {
      booted = await promptForDeviceAsync(devices);
    }
    if (!booted) {
      return { success: false, error: 'escaped' };
    }
    device = booted;
  }

  // No URL, and is devClient
  if (!projectUrl) {
    if (!launchActivity) {
      applicationId = applicationId ?? (await resolveApplicationIdAsync(projectRoot));
      if (!applicationId) {
        return {
          success: false,
          error:
            'Cannot resolve application identifier or URI scheme to open the native Android app.\nBuild the native app with `expo run:android` or `eas build -p android`',
        };
      }
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
      return { success: false, error };
    }
    return {
      success: true,
      // TODO: Remove this hack
      url: '',
    };
  }

  try {
    await openUrlAsync({
      url: projectUrl,
      device,
      isDetached: !!exp.isDetached,
      sdkVersion: exp.sdkVersion,
      devClient,
      exp,
      projectRoot,
    });
    return { success: true, url: projectUrl };
  } catch (e) {
    if (e.isAbortError) {
      // Don't log anything when the user cancelled the process
      return { success: false, error: 'escaped' };
    } else {
      e.message = `Couldn't start project on Android: ${e.message}`;
    }
    return { success: false, error: e };
  }
}
export async function openWebProjectAsync(
  projectRoot: string,
  {
    shouldPrompt,
  }: {
    shouldPrompt?: boolean;
  } = {}
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    await startAdbReverseAsync(projectRoot);

    const projectUrl = WebpackDevServer.getDevServerUrl();
    if (projectUrl === null) {
      return {
        success: false,
        error: `The web project has not been started yet`,
      };
    }
    const devices = await getAllAvailableDevicesAsync();
    let device: Device | null = devices[0];
    if (shouldPrompt) {
      device = await promptForDeviceAsync(devices);
    }
    if (!device) {
      return { success: false, error: 'escaped' };
    }

    await openUrlAsync({ url: projectUrl, device, isDetached: true, projectRoot });
    return { success: true, url: projectUrl };
  } catch (e) {
    return { success: false, error: `Couldn't open the web project on Android: ${e.message}` };
  }
}

// Adb reverse
async function getAdbReversePortsAsync(projectRoot: string): Promise<number[]> {
  const expRc = await readExpRcAsync(projectRoot);
  const userDefinedAdbReversePorts = expRc.extraAdbReversePorts || [];

  return [getNativeDevServerPort(), ...userDefinedAdbReversePorts].filter(Boolean);
}

export async function startAdbReverseAsync(projectRoot: string): Promise<boolean> {
  const adbReversePorts = await getAdbReversePortsAsync(projectRoot);

  const devices = await getAttachedDevicesAsync();
  for (const device of devices) {
    for (const port of adbReversePorts) {
      if (!(await adbReverse({ device, port }))) {
        return false;
      }
    }
  }

  return true;
}

export async function stopAdbReverseAsync(projectRoot: string): Promise<void> {
  const adbReversePorts = await getAdbReversePortsAsync(projectRoot);

  const devices = await getAttachedDevicesAsync();
  for (const device of devices) {
    for (const port of adbReversePorts) {
      await adbReverseRemove({ device, port });
    }
  }
}

async function adbReverse({ device, port }: { device: Device; port: number }): Promise<boolean> {
  if (!(await _isDeviceAuthorizedAsync(device))) {
    return false;
  }

  try {
    await getAdbOutputAsync(adbPidArgs(device.pid, 'reverse', `tcp:${port}`, `tcp:${port}`));
    return true;
  } catch (e) {
    Log.warn(`Couldn't adb reverse: ${e.message}`);
    return false;
  }
}

async function adbReverseRemove({
  device,
  port,
}: {
  device: Device;
  port: number;
}): Promise<boolean> {
  if (!(await _isDeviceAuthorizedAsync(device))) {
    return false;
  }

  try {
    await getAdbOutputAsync(adbPidArgs(device.pid, 'reverse', '--remove', `tcp:${port}`));
    return true;
  } catch (e) {
    // Don't send this to warn because we call this preemptively sometimes
    Log.debug(`Couldn't adb reverse remove: ${e.message}`);
    return false;
  }
}

function adbPidArgs(pid: Device['pid'], ...options: string[]): string[] {
  const args = [];
  if (pid) {
    args.push('-s', pid);
  }
  return args.concat(options);
}

export async function maybeStopAdbDaemonAsync() {
  if (_isAdbOwner !== true) {
    return false;
  }

  try {
    await getAdbOutputAsync(['kill-server']);
    return true;
  } catch {
    return false;
  }
}

function nameStyleForDevice(device: Device) {
  const isActive = device.isBooted;
  if (!isActive) {
    // Use no style changes for a disconnected device that is available to be opened.
    return (text: string) => text;
  }
  // A device that is connected and ready to be used should be bolded to match iOS.
  if (device.isAuthorized) {
    return chalk.bold;
  }
  // Devices that are unauthorized and connected cannot be used, but they are connected so gray them out.
  return (text: string) => chalk.bold(chalk.gray(text));
}

export async function promptForDeviceAsync(devices: Device[]): Promise<Device | null> {
  // TODO: provide an option to add or download more simulators

  const { value } = await promptAsync(
    {
      type: 'autocomplete',
      name: 'value',
      limit: 11,
      message: 'Select a device/emulator',
      choices: devices.map((item) => {
        const format = nameStyleForDevice(item);
        const type = item.isAuthorized ? item.type : 'unauthorized';
        return {
          title: `${format(item.name)} ${chalk.dim(`(${type})`)}`,
          value: item.name,
        };
      }),
      suggest: (input: any, choices: any) => {
        const regex = new RegExp(input, 'i');
        return choices.filter((choice: any) => regex.test(choice.title));
      },
    },
    {
      isCancelable: true,
    }
  );

  const device = value ? devices.find(({ name }) => name === value)! : null;

  if (device?.isAuthorized === false) {
    logUnauthorized(device);
    return null;
  }

  return device;
}

export enum DeviceABI {
  // The arch specific android target platforms are soft-deprecated.
  // Instead of using TargetPlatform as a combination arch + platform
  // the code will be updated to carry arch information in [DarwinArch]
  // and [AndroidArch].
  arm = 'arm',
  arm64 = 'arm64',
  x64 = 'x64',
  x86 = 'x86',
  armeabiV7a = 'armeabi-v7a',
  armeabi = 'armeabi',
  universal = 'universal',
}

type DeviceProperties = Record<string, string>;

// Can sometimes be null
// http://developer.android.com/ndk/guides/abis.html
const PROP_BOOT_ANIMATION_STATE = 'init.svc.bootanim';

async function getPropertyDataForDeviceAsync(
  device: Pick<Device, 'pid'>,
  prop?: string
): Promise<DeviceProperties> {
  // @ts-ignore
  const propCommand = adbPidArgs(...[device.pid, 'shell', 'getprop', prop].filter(Boolean));
  try {
    // Prevent reading as UTF8.
    const results = (await getAdbFileOutputAsync(propCommand, 'latin1')).toString('latin1');
    // Like:
    // [wifi.direct.interface]: [p2p-dev-wlan0]
    // [wifi.interface]: [wlan0]

    if (prop) {
      return {
        [prop]: results,
      };
    }
    return parseAdbDeviceProperties(results);
  } catch (error) {
    // TODO: Ensure error has message and not stderr
    throw new Error(`Failed to get properties for device (${device.pid}): ${error.message}`);
  }
}

export function parseAdbDeviceProperties(devicePropertiesString: string) {
  const properties: DeviceProperties = {};
  const propertyExp = /\[(.*?)\]: \[(.*?)\]/gm;
  for (const match of devicePropertiesString.matchAll(propertyExp)) {
    properties[match[1]] = match[2];
  }
  return properties;
}
