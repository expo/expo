import { ExpoConfig, getConfig } from '@expo/config';
import { IOSConfig } from '@expo/config-plugins';
import * as osascript from '@expo/osascript';
import plist from '@expo/plist';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import prompts from 'prompts';
import semver from 'semver';

import * as Log from '../../log';
import { delayAsync } from '../../utils/delay';
import { downloadAppAsync } from '../../utils/downloadAppAsync';
import { learnMore } from '../../utils/link';
import { profile } from '../../utils/profile';
import { confirmAsync } from '../../utils/prompts';
import UserSettings from '../api/UserSettings';
import * as Versions from '../api/Versions';
import { LoadingEvent, Logger } from '../logger';
import { constructDeepLinkAsync, constructLoadingUrlAsync } from '../serverUrl';
import { isDevClientPackageInstalled } from '../startAsync';
import * as Webpack from '../webpack/Webpack';
import * as BundleIdentifier from './BundleIdentifier';
import * as CoreSimulator from './CoreSimulator';
import * as SimControl from './SimControl';
import * as SimControlLogs from './SimControlLogs';
import { ensureSimulatorAppRunningAsync } from './utils/ensureSimulatorAppRunningAsync';
import { TimeoutError } from './utils/waitForActionAsync';
import * as Xcode from './xcode';

let _lastUrl: string | null = null;

const EXPO_GO_BUNDLE_IDENTIFIER = 'host.exp.Exponent';
const SUGGESTED_XCODE_VERSION = `${Xcode.minimumVersion}.0`;
const INSTALL_WARNING_TIMEOUT = 60 * 1000;

export function isPlatformSupported() {
  return process.platform === 'darwin';
}

/**
 * Ensure Xcode is installed an recent enough to be used with Expo.
 *
 * @return true when Xcode is installed, false when the process should end.
 */
export async function ensureXcodeInstalledAsync(): Promise<boolean> {
  const promptToOpenAppStoreAsync = async (message: string) => {
    // This prompt serves no purpose accept informing the user what to do next, we could just open the App Store but it could be confusing if they don't know what's going on.
    const confirm = await confirmAsync({ initial: true, message });
    if (confirm) {
      Log.log(`Going to the App Store, re-run Expo when Xcode is finished installing.`);
      Xcode.openAppStore(Xcode.appStoreId);
    }
  };

  const version = profile(Xcode.getXcodeVersion)();
  if (!version) {
    // Almost certainly Xcode isn't installed.
    await promptToOpenAppStoreAsync(
      `Xcode needs to be installed (don't worry, you won't have to use it), would you like to continue to the App Store?`
    );
    return false;
  }

  if (!semver.valid(version)) {
    // Not sure why this would happen, if it does we should add a more confident error message.
    Log.error(`Xcode version is in an unknown format: ${version}`);
    return false;
  }

  if (semver.lt(version, SUGGESTED_XCODE_VERSION)) {
    // Xcode version is too old.
    await promptToOpenAppStoreAsync(
      `Xcode (${version}) needs to be updated to at least version ${Xcode.minimumVersion}, would you like to continue to the App Store?`
    );
    return false;
  }

  return true;
}

let _isXcodeCLIInstalled: boolean | null = null;

export async function ensureXcodeCommandLineToolsInstalledAsync(): Promise<boolean> {
  // NOTE(Bacon): See `isSimulatorInstalledAsync` for more info on why we cache this value.
  if (_isXcodeCLIInstalled != null) {
    return _isXcodeCLIInstalled;
  }
  const _ensureXcodeCommandLineToolsInstalledAsync = async () => {
    if (!(await ensureXcodeInstalledAsync())) {
      // Need Xcode to install the CLI afaict
      return false;
    } else if (await SimControl.isXcrunInstalledAsync()) {
      // Run this second to ensure the Xcode version check is run.
      return true;
    }

    async function pendingAsync(): Promise<boolean> {
      if (await SimControl.isXcrunInstalledAsync()) {
        return true;
      } else {
        await delayAsync(100);
        return await pendingAsync();
      }
    }

    // This prompt serves no purpose accept informing the user what to do next, we could just open the App Store but it could be confusing if they don't know what's going on.
    const confirm = await confirmAsync({
      initial: true,
      message: `Xcode ${chalk.bold`Command Line Tools`} needs to be installed (requires ${chalk.bold`sudo`}), continue?`,
    });

    if (!confirm) {
      return false;
    }

    try {
      await spawnAsync('sudo', [
        'xcode-select',
        '--install',
        // TODO: Is there any harm in skipping this?
        // '--switch', '/Applications/Xcode.app'
      ]);
      // Most likely the user will cancel the process, but if they don't this will continue checking until the CLI is available.
      await pendingAsync();
      return true;
    } catch (error) {
      // TODO: Figure out why this might get called (cancel early, network issues, server problems)
      // TODO: Handle me
    }
    return false;
  };
  _isXcodeCLIInstalled = await _ensureXcodeCommandLineToolsInstalledAsync();

  return _isXcodeCLIInstalled;
}

async function getSimulatorAppIdAsync(): Promise<string | null> {
  let result;
  try {
    result = (await osascript.execAsync('id of app "Simulator"')).trim();
  } catch {
    // This error may occur in CI where the users intends to install just the simulators but no Xcode.
    return null;
  }
  return result;
}

let _isSimulatorInstalled: null | boolean = null;

// Simulator installed
export async function isSimulatorInstalledAsync(): Promise<boolean> {
  if (_isSimulatorInstalled != null) {
    return _isSimulatorInstalled;
  }
  // NOTE(Bacon): This method can take upwards of 1-2s to run so we should cache the results per process.
  // If the user installs Xcode while expo start is running, they'll need to restart
  // the process for the command to work properly.
  // This is better than waiting 1-2s every time you want to open the app on iOS.
  const _isSimulatorInstalledAsync = async () => {
    // Check to ensure Xcode and its CLI are installed and up to date.
    if (!(await ensureXcodeCommandLineToolsInstalledAsync())) {
      return false;
    }
    // TODO: extract into ensureSimulatorInstalled method

    const result = await getSimulatorAppIdAsync();
    if (!result) {
      // This error may occur in CI where the users intends to install just the simulators but no Xcode.
      Log.error(
        "Can't determine id of Simulator app; the Simulator is most likely not installed on this machine. Run `sudo xcode-select -s /Applications/Xcode.app`"
      );
      return false;
    }
    if (
      result !== 'com.apple.iphonesimulator' &&
      result !== 'com.apple.CoreSimulator.SimulatorTrampoline'
    ) {
      // TODO: FYI
      Log.warn(
        "Simulator is installed but is identified as '" + result + "'; don't know what that is."
      );
      return false;
    }

    // make sure we can run simctl
    try {
      await SimControl.simctlAsync(['help']);
    } catch (e) {
      if (e.isXDLError) {
        Log.error(e.toString());
      } else {
        Log.warn(`Unable to run simctl: ${e.toString()}`);
        Log.error(
          'xcrun may not be configured correctly. Try running `sudo xcode-select --reset` and running this again.'
        );
      }
      return false;
    }

    return true;
  };
  _isSimulatorInstalled = await _isSimulatorInstalledAsync();

  return _isSimulatorInstalled;
}

/**
 * Ensure a simulator is booted and the Simulator app is opened.
 * This is where any timeout related error handling should live.
 */
export async function ensureSimulatorOpenAsync(
  { udid, osType }: { udid?: string; osType?: string } = {},
  tryAgain: boolean = true
): Promise<SimControl.SimulatorDevice> {
  // Use a default simulator if none was specified
  if (!udid) {
    // If a simulator is open, side step the entire booting sequence.
    const simulatorOpenedByApp = await getBestBootedSimulatorAsync({ osType });
    if (simulatorOpenedByApp) {
      return simulatorOpenedByApp;
    }

    // Otherwise, find the best possible simulator from user defaults and continue
    udid = await getBestUnbootedSimulatorAsync({ osType });
  }

  const bootedDevice = await profile(SimControl.waitForDeviceToBootAsync)({ udid });

  if (!bootedDevice) {
    // Give it a second chance, this might not be needed but it could potentially lead to a better UX on slower devices.
    if (tryAgain) {
      return await ensureSimulatorOpenAsync({ udid, osType }, false);
    }
    // TODO: We should eliminate all needs for a timeout error, it's bad UX to get an error about the simulator not starting while the user can clearly see it starting on their slow computer.
    throw new TimeoutError(
      `Simulator didn't boot fast enough. Try opening Simulator first, then running your app.`
    );
  }
  return bootedDevice;
}

async function getBestBootedSimulatorAsync({ osType }: { osType?: string }) {
  let simulatorOpenedByApp: SimControl.SimulatorDevice | null;
  if (CoreSimulator.isEnabled()) {
    simulatorOpenedByApp = await CoreSimulator.getDeviceInfoAsync().catch(() => null);
  } else {
    const simulatorDeviceInfo = await SimControl.listAsync('devices');
    const devices = Object.values(simulatorDeviceInfo.devices).reduce((prev, runtime) => {
      return prev.concat(runtime.filter((device) => device.state === 'Booted'));
    }, []);
    simulatorOpenedByApp = devices[0];
  }

  // This should prevent opening a second simulator in the chance that default
  // simulator doesn't match what the Simulator app would open by default.
  if (
    simulatorOpenedByApp?.udid &&
    (!osType || (osType && simulatorOpenedByApp.osType === osType))
  ) {
    return simulatorOpenedByApp;
  }

  return null;
}

async function getBestUnbootedSimulatorAsync({ osType }: { osType?: string }): Promise<string> {
  const defaultUdid = _getDefaultSimulatorDeviceUDID();

  if (defaultUdid && !osType) {
    return defaultUdid;
  }

  const simulators = await getSelectableSimulatorsAsync({ osType });

  if (!simulators.length) {
    // TODO: Prompt to install the simulators
    throw new Error(`No ${osType || 'iOS'} devices available in Simulator.app`);
  }

  // If the default udid is defined, then check to ensure its osType matches the required os.
  if (defaultUdid) {
    const defaultSimulator = simulators.find((device) => device.udid === defaultUdid);
    if (defaultSimulator?.osType === osType) {
      return defaultUdid;
    }
  }

  // Return first selectable device.
  return simulators[0].udid;
}

async function getBestSimulatorAsync({ osType }: { osType?: string }): Promise<string> {
  const simulatorOpenedByApp = await getBestBootedSimulatorAsync({ osType });

  if (simulatorOpenedByApp) {
    return simulatorOpenedByApp.udid;
  }

  return await getBestUnbootedSimulatorAsync({ osType });
}

/**
 * Get all simulators supported by Expo (iOS only).
 */
async function getSelectableSimulatorsAsync({ osType = 'iOS' }: { osType?: string } = {}): Promise<
  SimControl.SimulatorDevice[]
> {
  const simulators = await SimControl.listSimulatorDevicesAsync();
  return simulators.filter((device) => device.isAvailable && device.osType === osType);
}

// TODO: Delete
async function getBootedSimulatorsAsync(): Promise<SimControl.SimulatorDevice[]> {
  const simulators = await SimControl.listSimulatorDevicesAsync();
  return simulators.filter((device) => device.state === 'Booted');
}

// TODO: Delete
export async function isSimulatorBootedAsync({
  udid,
}: {
  udid?: string;
} = {}): Promise<SimControl.SimulatorDevice | null> {
  // Simulators can be booted even if the app isn't running :(
  const devices = await getBootedSimulatorsAsync();
  if (udid) {
    return devices.find((bootedDevice) => bootedDevice.udid === udid) ?? null;
  } else {
    return devices[0] ?? null;
  }
}

function _getDefaultSimulatorDeviceUDID() {
  try {
    const defaultDeviceUDID = execSync(
      `defaults read com.apple.iphonesimulator CurrentDeviceUDID`,
      { stdio: 'pipe' }
    ).toString();
    return defaultDeviceUDID.trim();
  } catch (e) {
    return null;
  }
}

export async function activateSimulatorWindowAsync() {
  // TODO: Focus the individual window
  return await osascript.execAsync(`tell application "Simulator" to activate`);
}

export async function closeSimulatorAppAsync() {
  return await osascript.execAsync('tell application "Simulator" to quit');
}

export async function isExpoClientInstalledOnSimulatorAsync({
  udid,
}: {
  udid: string;
}): Promise<boolean> {
  return !!(await SimControl.getContainerPathAsync({
    udid,
    bundleIdentifier: EXPO_GO_BUNDLE_IDENTIFIER,
  }));
}

export async function waitForExpoClientInstalledOnSimulatorAsync({
  udid,
}: {
  udid: string;
}): Promise<boolean> {
  if (await isExpoClientInstalledOnSimulatorAsync({ udid })) {
    return true;
  } else {
    await delayAsync(100);
    return await waitForExpoClientInstalledOnSimulatorAsync({ udid });
  }
}

export async function waitForExpoClientUninstalledOnSimulatorAsync({
  udid,
}: {
  udid: string;
}): Promise<boolean> {
  if (!(await isExpoClientInstalledOnSimulatorAsync({ udid }))) {
    return true;
  } else {
    await delayAsync(100);
    return await waitForExpoClientInstalledOnSimulatorAsync({ udid });
  }
}

export async function expoVersionOnSimulatorAsync({
  udid,
}: {
  udid: string;
}): Promise<string | null> {
  const localPath = await SimControl.getContainerPathAsync({
    udid,
    bundleIdentifier: EXPO_GO_BUNDLE_IDENTIFIER,
  });
  if (!localPath) {
    return null;
  }

  const regex = /Exponent-([0-9.]+).*\.app$/;
  const regexMatch = regex.exec(localPath);
  if (!regexMatch) {
    return null;
  }

  let matched = regexMatch[1];
  // If the value is matched like 1.0.0. then remove the trailing dot.
  if (matched.endsWith('.')) {
    matched = matched.substr(0, matched.length - 1);
  }
  return matched;
}

export async function doesExpoClientNeedUpdatedAsync(
  simulator: Pick<SimControl.SimulatorDevice, 'udid'>,
  sdkVersion?: string
): Promise<boolean> {
  // Test that upgrading works by returning true
  // return true;
  const versions = await profile(Versions.getVersionsAsync)();
  const clientForSdk = await profile(getClientForSDK)(sdkVersion);
  const latestVersionForSdk = clientForSdk?.version ?? versions.iosVersion;

  const installedVersion = await expoVersionOnSimulatorAsync(simulator);
  if (installedVersion && semver.lt(installedVersion, latestVersionForSdk)) {
    return true;
  }
  return false;
}

// If specific URL given just always download it and don't use cache
export async function _downloadSimulatorAppAsync(
  url?: string,
  downloadProgressCallback?: (roundedProgress: number) => void
) {
  if (!url) {
    const versions = await Versions.getVersionsAsync();
    url = versions.iosUrl;
  }

  const filename = path.parse(url).name;
  const dir = path.join(simulatorCacheDirectory(), `${filename}.app`);

  if (await fs.pathExists(dir)) {
    const filesInDir = await fs.readdir(dir);
    if (filesInDir.length > 0) {
      return dir;
    } else {
      fs.removeSync(dir);
    }
  }

  fs.mkdirpSync(dir);
  try {
    await downloadAppAsync(url, dir, { extract: true }, downloadProgressCallback);
  } catch (e) {
    fs.removeSync(dir);
    throw e;
  }

  return dir;
}

// url: Optional URL of Exponent.app tarball to download
export async function installExpoOnSimulatorAsync({
  url,
  simulator,
  version,
}: {
  simulator: Pick<SimControl.SimulatorDevice, 'name' | 'udid'>;
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

  Logger.notifications.info(
    { code: LoadingEvent.START_PROGRESS_BAR },
    'Downloading the Expo Go app [:bar] :percent :etas'
  );

  warningTimer = setWarningTimer();

  const dir = await _downloadSimulatorAppAsync(url, (progress) => {
    Logger.notifications.info({ code: LoadingEvent.TICK_PROGRESS_BAR }, progress);
  });

  Logger.notifications.info({ code: LoadingEvent.STOP_PROGRESS_BAR });

  const message = version
    ? `Installing Expo Go ${version} on ${simulator.name}`
    : `Installing Expo Go on ${simulator.name}`;
  Logger.notifications.info({ code: LoadingEvent.START_LOADING }, message);
  warningTimer = setWarningTimer();

  const result = await SimControl.installAsync({ udid: simulator.udid, dir });
  Logger.notifications.info({ code: LoadingEvent.STOP_LOADING });

  clearTimeout(warningTimer);
  return result;
}

export async function uninstallExpoAppFromSimulatorAsync({ udid }: { udid?: string } = {}) {
  try {
    Log.log('Uninstalling Expo Go from iOS simulator.');
    await SimControl.uninstallAsync({ udid, bundleIdentifier: EXPO_GO_BUNDLE_IDENTIFIER });
  } catch (e) {
    if (!e.message?.includes('No devices are booted.')) {
      Log.error(e);
      throw e;
    }
  }
}

function simulatorCacheDirectory() {
  const dir = path.join(UserSettings.getDirectory(), 'ios-simulator-app-cache');
  fs.mkdirpSync(dir);
  return dir;
}

export async function upgradeExpoAsync(
  options: {
    udid?: string;
    url?: string;
    version?: string;
  } = {}
): Promise<boolean> {
  if (!(await isSimulatorInstalledAsync())) {
    return false;
  }

  const simulator = await ensureSimulatorOpenAsync(options);

  await uninstallExpoAppFromSimulatorAsync(simulator);
  const installResult = await installExpoOnSimulatorAsync({
    url: options.url,
    version: options.version,
    simulator,
  });
  if (installResult.status !== 0) {
    return false;
  }

  if (_lastUrl) {
    Log.log(`\u203A Opening ${chalk.underline(_lastUrl)} in Expo Go`);
    await Promise.all([
      // Open the Simulator.app app
      ensureSimulatorAppRunningAsync(simulator),
      // Launch the project in the simulator, this can be parallelized for some reason.
      SimControl.openURLAsync({ udid: simulator.udid, url: _lastUrl }),
    ]);
    _lastUrl = null;
  }

  return true;
}

async function openUrlInSimulatorSafeAsync({
  url,
  udid,
  isDetached = false,
  sdkVersion,
  devClient = false,
  projectRoot,
  exp,
  skipNativeLogs = false,
}: {
  url: string;
  udid?: string;
  sdkVersion?: string;
  isDetached: boolean;
  devClient?: boolean;
  exp?: ExpoConfig;
  projectRoot: string;
  skipNativeLogs?: boolean;
}): Promise<
  | { success: true; device: SimControl.SimulatorDevice; bundleIdentifier: string }
  | { success: false; msg: string }
> {
  if (!exp) {
    exp = profile(getConfig)(projectRoot, { skipSDKVersionRequirement: true }).exp;
  }
  let simulator: SimControl.SimulatorDevice | null = null;
  try {
    simulator = await profile(ensureSimulatorOpenAsync)({ udid });
  } catch (error) {
    return {
      success: false,
      msg: error.message,
    };
  }
  Log.log(`\u203A Opening ${chalk.underline(url)} on ${chalk.bold(simulator.name)}`);

  let bundleIdentifier = EXPO_GO_BUNDLE_IDENTIFIER;
  try {
    if (devClient) {
      bundleIdentifier = await profile(BundleIdentifier.configureBundleIdentifierAsync)(
        projectRoot,
        exp
      );
      await profile(assertDevClientInstalledAsync)(simulator, bundleIdentifier);
      if (!skipNativeLogs) {
        // stream logs before opening the client.
        await streamLogsAsync({ udid: simulator.udid, bundleIdentifier });
      }
    } else if (!isDetached) {
      await profile(ensureExpoClientInstalledAsync)(simulator, sdkVersion);
      _lastUrl = url;
    } else if (!devClient && isDevClientPackageInstalled(projectRoot)) {
      bundleIdentifier = ''; // it will open browser.
    }

    await Promise.all([
      // Open the Simulator.app app, and bring it to the front
      profile(async () => {
        await ensureSimulatorAppRunningAsync({ udid: simulator?.udid });
        activateSimulatorWindowAsync();
      }, 'parallel: ensureSimulatorAppRunningAsync')(),
      // Launch the project in the simulator, this can be parallelized for some reason.
      profile(SimControl.openURLAsync, 'parallel: openURLAsync')({ udid: simulator.udid, url }),
    ]);
  } catch (e) {
    if (e.status === 194) {
      // An error was encountered processing the command (domain=NSOSStatusErrorDomain, code=-10814):
      // The operation couldn’t be completed. (OSStatus error -10814.)
      //
      // This can be thrown when no app conforms to the URI scheme that we attempted to open.

      return {
        success: false,
        msg: `Device ${simulator.name} (${simulator.udid}) has no app to handle the URI: ${url}`,
      };
    }
    if (e.isXDLError) {
      // Hit some internal error, don't try again.
      // This includes Xcode license errors
      // Log.error(e.message);
      return {
        success: false,
        msg: `${e.toString()}`,
      };
    }

    return {
      success: false,
      msg: `${e.toString()}`,
    };
  }

  Analytics.logEvent('Open Url on Device', {
    platform: 'ios',
  });

  return {
    success: true,
    device: simulator,
    bundleIdentifier,
  };
}

async function assertDevClientInstalledAsync(
  simulator: Pick<SimControl.SimulatorDevice, 'udid' | 'name'>,
  bundleIdentifier: string
): Promise<void> {
  if (!(await SimControl.getContainerPathAsync({ udid: simulator.udid, bundleIdentifier }))) {
    throw new Error(
      `The development client (${bundleIdentifier}) for this project is not installed. ` +
        `Please build and install the client on the simulator first.\n${learnMore(
          'https://docs.expo.dev/clients/distribution-for-ios/#building-for-ios'
        )}`
    );
  }
}

// Keep a list of simulator UDIDs so we can prevent asking multiple times if a user wants to upgrade.
// This can prevent annoying interactions when they don't want to upgrade for whatever reason.
const hasPromptedToUpgrade: Record<string, boolean> = {};

async function ensureExpoClientInstalledAsync(
  simulator: Pick<SimControl.SimulatorDevice, 'udid' | 'name'>,
  sdkVersion?: string
) {
  let isInstalled = await isExpoClientInstalledOnSimulatorAsync(simulator);

  if (isInstalled && !hasPromptedToUpgrade[simulator.udid]) {
    // Only prompt/check for updates once per simulator in a single run.
    hasPromptedToUpgrade[simulator.udid] = true;
    if (await profile(doesExpoClientNeedUpdatedAsync)(simulator, sdkVersion)) {
      const confirm = await confirmAsync({
        initial: true,
        message: `Expo Go on ${simulator.name} is outdated, would you like to upgrade?`,
      });
      if (confirm) {
        // TODO: Is there any downside to skipping the uninstall step?
        // await uninstallExpoAppFromSimulatorAsync(simulator);
        // await waitForExpoClientUninstalledOnSimulatorAsync(simulator);
        isInstalled = false;
      }
    }
  }
  // If it's still "not installed" then install it (again).
  if (!isInstalled) {
    const iosClient = await getClientForSDK(sdkVersion);
    await installExpoOnSimulatorAsync({ simulator, ...iosClient });
    await waitForExpoClientInstalledOnSimulatorAsync(simulator);
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
    url: sdkVersion.iosClientUrl,
    version: sdkVersion.iosClientVersion,
  };
}

export async function resolveApplicationIdAsync(projectRoot: string) {
  // Check xcode project
  try {
    const bundleId = await IOSConfig.BundleIdentifier.getBundleIdentifierFromPbxproj(projectRoot);
    if (bundleId) {
      return bundleId;
    }
  } catch {}

  // Check Info.plist
  try {
    const infoPlistPath = IOSConfig.Paths.getInfoPlistPath(projectRoot);
    const data = await plist.parse(fs.readFileSync(infoPlistPath, 'utf8'));
    if (data.CFBundleIdentifier && !data.CFBundleIdentifier.startsWith('$(')) {
      return data.CFBundleIdentifier;
    }
  } catch {}

  // Check Expo config
  const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true });
  return exp.ios?.bundleIdentifier;
}

async function _constructDeepLinkAsync(
  projectRoot: string,
  scheme?: string,
  devClient?: boolean
): Promise<string | null> {
  if (
    process.env['EXPO_ENABLE_INTERSTITIAL_PAGE'] &&
    !devClient &&
    isDevClientPackageInstalled(projectRoot)
  ) {
    return constructLoadingUrlAsync(projectRoot, 'ios', 'localhost');
  } else {
    try {
      return await constructDeepLinkAsync(projectRoot, {
        // Don't pass a `hostType` or ngrok will break.
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

export async function openProjectAsync({
  projectRoot,
  shouldPrompt,
  devClient,
  udid,
  scheme,
  skipNativeLogs,
  applicationId,
}: {
  projectRoot: string;
  shouldPrompt?: boolean;
  devClient?: boolean;
  scheme?: string;
  udid?: string;
  skipNativeLogs?: boolean;
  applicationId?: string;
}): Promise<
  | { success: true; url: string; udid: string; bundleIdentifier: string }
  | { success: false; error: string }
> {
  if (!(await profile(isSimulatorInstalledAsync)())) {
    return {
      success: false,
      error: 'Unable to verify Xcode and Simulator installation.',
    };
  }

  const projectUrl = await _constructDeepLinkAsync(projectRoot, scheme, devClient);
  Log.debug(`iOS project url: ${projectUrl}`);

  const { exp } = getConfig(projectRoot, {
    skipSDKVersionRequirement: true,
  });

  let device: SimControl.SimulatorDevice | null = null;
  if (!udid && shouldPrompt) {
    const devices = await getSelectableSimulatorsAsync();
    device = await promptForSimulatorAsync(devices);
    if (!device) {
      return { success: false, error: 'escaped' };
    }
  } else {
    device = await ensureSimulatorOpenAsync({ udid });
  }

  // No URL, and is devClient
  if (!projectUrl) {
    applicationId = applicationId ?? (await resolveApplicationIdAsync(projectRoot));
    Log.debug(`Open iOS project from app id: ${applicationId}`);

    if (!applicationId) {
      return {
        success: false,
        error:
          'Cannot resolve bundle identifier or URI scheme to open the native iOS app.\nBuild the native app with `expo run:ios` or `eas build -p ios`',
      };
    }

    Log.log(`\u203A Opening ${chalk.underline(applicationId)} on ${chalk.bold(device.name)}`);

    const result = await SimControl.openBundleIdAsync({
      udid: device.udid,
      bundleIdentifier: applicationId,
    }).catch((error) => {
      if ('status' in error) {
        return error;
      }
      throw error;
    });
    if (result.status === 0) {
      await ensureSimulatorAppRunningAsync({ udid: device?.udid });
      activateSimulatorWindowAsync();
    } else {
      let errorMessage = `Couldn't open iOS app with ID "${applicationId}" on device "${device.name}".`;
      if (result.status === 4) {
        errorMessage += `\nThe app might not be installed, try installing it with: ${chalk.bold(
          `expo run:ios -d ${device.udid}`
        )}`;
      }
      errorMessage += chalk.gray(`\n${result.stderr}`);
      return { success: false, error: errorMessage };
    }
    return {
      success: true,
      udid: device.udid,
      bundleIdentifier: applicationId,
      // TODO: Remove this hack
      url: '',
    };
  }

  const result = await profile(openUrlInSimulatorSafeAsync)({
    udid: device?.udid,
    url: projectUrl,
    sdkVersion: exp.sdkVersion,
    isDetached: !!exp.isDetached,
    devClient,
    exp,
    projectRoot,
    skipNativeLogs,
  });

  if (result.success) {
    return {
      success: true,
      url: projectUrl,
      udid: result.device.udid,
      bundleIdentifier: result.bundleIdentifier,
    };
  }
  return { success: result.success, error: result.msg };
}

export async function streamLogsAsync({
  bundleIdentifier,
  udid,
}: {
  bundleIdentifier: string;
  udid: string;
}) {
  if (SimControlLogs.isStreamingLogs(udid)) {
    return;
  }

  const imageName = await SimControlLogs.getImageNameFromBundleIdentifierAsync(
    udid,
    bundleIdentifier
  );

  if (imageName) {
    // Attach simulator log observer
    SimControlLogs.streamLogs({ pid: imageName, udid });
  }
}

export async function openWebProjectAsync({
  projectRoot,
  shouldPrompt,
}: {
  shouldPrompt: boolean;
  projectRoot: string;
}): Promise<{ success: true; url: string } | { success: false; error: string }> {
  if (!(await isSimulatorInstalledAsync())) {
    return {
      success: false,
      error: 'Unable to verify Xcode and Simulator installation.',
    };
  }

  const projectUrl = await Webpack.getUrlAsync(projectRoot);
  if (projectUrl === null) {
    return {
      success: false,
      error: `The web project has not been started yet`,
    };
  }

  let device: SimControl.SimulatorDevice | null = null;
  if (shouldPrompt) {
    const devices = await getSelectableSimulatorsAsync();
    device = await promptForSimulatorAsync(devices);
    if (!device) {
      return { success: false, error: 'escaped' };
    }
  }

  const result = await openUrlInSimulatorSafeAsync({
    url: projectUrl,
    udid: device?.udid,
    isDetached: true,
    projectRoot,
  });
  if (result.success) {
    // run out of sync
    activateSimulatorWindowAsync();
    return { success: true, url: projectUrl };
  }
  return { success: result.success, error: result.msg };
}

/**
 * Sort the devices so the last simulator that was opened (user's default) is the first suggested.
 *
 * @param devices
 */
export async function sortDefaultDeviceToBeginningAsync(
  devices: SimControl.SimulatorDevice[],
  osType?: string
): Promise<SimControl.SimulatorDevice[]> {
  const defaultUdid = await getBestSimulatorAsync({ osType });
  if (defaultUdid) {
    let iterations = 0;
    while (devices[0].udid !== defaultUdid && iterations < devices.length) {
      devices.push(devices.shift()!);
      iterations++;
    }
  }
  return devices;
}

export async function promptForSimulatorAsync(
  devices: SimControl.SimulatorDevice[],
  osType?: string
): Promise<SimControl.SimulatorDevice | null> {
  devices = await sortDefaultDeviceToBeginningAsync(devices, osType);
  // TODO: Bail on non-interactive
  const results = await promptForDeviceAsync(devices);

  return results ? devices.find(({ udid }) => results === udid)! : null;
}

async function promptForDeviceAsync(
  devices: SimControl.SimulatorDevice[]
): Promise<string | undefined> {
  // TODO: provide an option to add or download more simulators
  // TODO: Add support for physical devices too.

  const { value } = await prompts({
    type: 'autocomplete',
    name: 'value',
    limit: 11,
    message: 'Select a simulator',
    choices: devices.map((item) => {
      const isActive = item.state === 'Booted';
      const format = isActive ? chalk.bold : (text: string) => text;
      return {
        title: `${format(item.name)} ${chalk.dim(`(${item.osVersion})`)}`,
        value: item.udid,
      };
    }),
    suggest: (input: any, choices: any) => {
      const regex = new RegExp(input, 'i');
      return choices.filter((choice: any) => regex.test(choice.title));
    },
  });

  return value;
}

export { ensureSimulatorAppRunningAsync };
