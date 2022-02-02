import spawnAsync, { SpawnOptions, SpawnResult } from '@expo/spawn-async';
import chalk from 'chalk';
import { execSync } from 'child_process';
import path from 'path';

import * as Log from '../../log';
import { CommandError } from '../../utils/errors';
import { profile } from '../../utils/profile';
import * as CoreSimulator from './CoreSimulator';
import { waitForActionAsync } from './utils/waitForActionAsync';

type DeviceState = 'Shutdown' | 'Booted';

export type SimulatorDevice = {
  availabilityError: 'runtime profile not found';
  /**
   * '/Users/name/Library/Developer/CoreSimulator/Devices/00E55DC0-0364-49DF-9EC6-77BE587137D4/data'
   */
  dataPath: string;
  /**
   * '/Users/name/Library/Logs/CoreSimulator/00E55DC0-0364-49DF-9EC6-77BE587137D4'
   */
  logPath: string;
  /**
   * '00E55DC0-0364-49DF-9EC6-77BE587137D4'
   */
  udid: string;
  /**
   * com.apple.CoreSimulator.SimRuntime.tvOS-13-4
   */
  runtime: string;
  isAvailable: boolean;
  /**
   * 'com.apple.CoreSimulator.SimDeviceType.Apple-TV-1080p'
   */
  deviceTypeIdentifier: string;
  state: DeviceState;
  /**
   * 'Apple TV'
   */
  name: string;

  osType: OSType;
  /**
   * '13.4'
   */
  osVersion: string;
  /**
   * 'iPhone 11 (13.6)'
   */
  windowName: string;
};

export type XCTraceDevice = {
  /**
   * '00E55DC0-0364-49DF-9EC6-77BE587137D4'
   */
  udid: string;
  /**
   * 'Apple TV'
   */
  name: string;

  deviceType: 'device' | 'catalyst';
  /**
   * '13.4'
   */
  osVersion: string;
};

type OSType = 'iOS' | 'tvOS' | 'watchOS' | 'macOS';

type PermissionName =
  | 'all'
  | 'calendar'
  | 'contacts-limited'
  | 'contacts'
  | 'location'
  | 'location-always'
  | 'photos-add'
  | 'photos'
  | 'media-library'
  | 'microphone'
  | 'motion'
  | 'reminders'
  | 'siri';

type SimulatorDeviceList = {
  devices: {
    [runtime: string]: SimulatorDevice[];
  };
};

export async function getDefaultSimulatorDeviceUDIDAsync() {
  try {
    const { stdout: defaultDeviceUDID } = await spawnAsync('defaults', [
      'read',
      'com.apple.iphonesimulator',
      'CurrentDeviceUDID',
    ]);
    return defaultDeviceUDID.trim();
  } catch (e) {
    return null;
  }
}

/**
 * Returns the local path for the installed tar.app. Returns null when the app isn't installed.
 *
 * @param props.udid device udid.
 * @param props.bundleIdentifier bundle identifier for app
 * @returns local file path to installed app binary, e.g. '/Users/evanbacon/Library/Developer/CoreSimulator/Devices/EFEEA6EF-E3F5-4EDE-9B72-29EAFA7514AE/data/Containers/Bundle/Application/FA43A0C6-C2AD-442D-B8B1-EAF3E88CF3BF/Exponent-2.21.3.tar.app'
 */
export async function getContainerPathAsync({
  udid,
  bundleIdentifier,
}: {
  udid: string;
  bundleIdentifier: string;
}): Promise<string | null> {
  if (CoreSimulator.isEnabled()) {
    return CoreSimulator.getContainerPathAsync({ udid, bundleIdentifier });
  }
  try {
    const { stdout } = await xcrunAsync([
      'simctl',
      'get_app_container',
      deviceUDIDOrBooted(udid),
      bundleIdentifier,
    ]);
    return stdout.trim();
  } catch (error: any) {
    if (error.stderr?.match(/No such file or directory/)) {
      return null;
    }
    throw error;
  }
}

export async function waitForDeviceToBootAsync({
  udid,
}: Pick<SimulatorDevice, 'udid'>): Promise<SimulatorDevice | null> {
  return waitForActionAsync<SimulatorDevice | null>({
    action: () => bootAsync({ udid }),
  });
}

export async function openURLAsync(options: { udid?: string; url: string }): Promise<void> {
  try {
    // Skip logging since this is likely to fail.
    await xcrunAsync(['simctl', 'openurl', deviceUDIDOrBooted(options.udid), options.url]);
  } catch (error: any) {
    if (!error.stderr?.match(/Unable to lookup in current state: Shut/)) {
      throw error;
    }
    // If the device was in a weird in-between state ("Shutting Down" or "Shutdown"), then attempt to reboot it and try again.
    // This can happen when quitting the Simulator app, and immediately pressing `i` to reopen the project.

    // First boot the simulator
    await runBootAsync({ udid: deviceUDIDOrBooted(options.udid) });

    // Finally, try again...
    return await openURLAsync(options);
  }
}

export async function openBundleIdAsync(options: {
  udid?: string;
  bundleIdentifier: string;
}): Promise<SpawnResult> {
  return xcrunAsync([
    'simctl',
    'launch',
    deviceUDIDOrBooted(options.udid),
    options.bundleIdentifier,
  ]);
}

// This will only boot in headless mode if the Simulator app is not running.
export async function bootAsync({ udid }: { udid: string }): Promise<SimulatorDevice | null> {
  if (CoreSimulator.isEnabled()) {
    const device = await CoreSimulator.getDeviceInfoAsync({ udid }).catch(() => null);
    if (device?.state === 'Booted') {
      return device;
    }
    await runBootAsync({ udid });
    return await profile(CoreSimulator.getDeviceInfoAsync)({ udid });
  }

  // TODO: Deprecate
  await runBootAsync({ udid });
  return await isSimulatorBootedAsync({ udid });
}

async function getBootedSimulatorsAsync(): Promise<SimulatorDevice[]> {
  const simulatorDeviceInfo = await listAsync('devices');
  return Object.values(simulatorDeviceInfo.devices).reduce((prev, runtime) => {
    return prev.concat(runtime.filter((device) => device.state === 'Booted'));
  }, []);
}

async function isSimulatorBootedAsync({
  udid,
}: {
  udid?: string;
}): Promise<SimulatorDevice | null> {
  // Simulators can be booted even if the app isn't running :(
  const devices = await getBootedSimulatorsAsync();
  if (udid) {
    return devices.find((bootedDevice) => bootedDevice.udid === udid) ?? null;
  } else {
    return devices[0] ?? null;
  }
}

export async function runBootAsync({ udid }: { udid: string }) {
  try {
    // Skip logging since this is likely to fail.
    await xcrunAsync(['simctl', 'boot', udid]);
  } catch (error: any) {
    if (!error.stderr?.match(/Unable to boot device in current state: Booted/)) {
      throw error;
    }
  }
}

export async function installAsync(options: { udid: string; dir: string }): Promise<any> {
  return simctlAsync(['install', deviceUDIDOrBooted(options.udid), options.dir]);
}

export async function uninstallAsync(options: {
  udid?: string;
  bundleIdentifier: string;
}): Promise<any> {
  return simctlAsync(['uninstall', deviceUDIDOrBooted(options.udid), options.bundleIdentifier]);
}

function parseSimControlJSONResults(input: string): any {
  try {
    return JSON.parse(input);
  } catch (error: any) {
    // Nov 15, 2020: Observed this can happen when opening the simulator and the simulator prompts the user to update the XC command line tools.
    // Unexpected token I in JSON at position 0
    if (error.message.match('Unexpected token')) {
      Log.error(`Apple's simctl returned malformed JSON:\n${input}`);
    }
    throw error;
  }
}

// TODO: Compare with
// const results = await SimControl.xcrunAsync(['instruments', '-s']);
export async function listAsync(
  type: 'devices' | 'devicetypes' | 'runtimes' | 'pairs',
  query?: string | 'available'
): Promise<SimulatorDeviceList> {
  const result = await simctlAsync(['list', type, '--json', query]);
  const info = parseSimControlJSONResults(result.stdout) as SimulatorDeviceList;

  for (const runtime of Object.keys(info.devices)) {
    // Given a string like 'com.apple.CoreSimulator.SimRuntime.tvOS-13-4'
    const runtimeSuffix = runtime.split('com.apple.CoreSimulator.SimRuntime.').pop()!;
    // Create an array [tvOS, 13, 4]
    const [osType, ...osVersionComponents] = runtimeSuffix.split('-');
    // Join the end components [13, 4] -> '13.4'
    const osVersion = osVersionComponents.join('.');
    const sims = info.devices[runtime];
    for (const device of sims) {
      device.runtime = runtime;
      device.osVersion = osVersion;
      device.windowName = `${device.name} (${osVersion})`;
      device.osType = osType as OSType;
    }
  }
  return info;
}

export async function listSimulatorDevicesAsync() {
  if (CoreSimulator.isEnabled()) {
    return CoreSimulator.listDevicesAsync();
  }
  const simulatorDeviceInfo = await listAsync('devices');
  return Object.values(simulatorDeviceInfo.devices).reduce((prev, runtime) => {
    return prev.concat(runtime);
  }, []);
}

/**
 * Get a list of all connected devices.
 */
export async function listDevicesAsync(): Promise<XCTraceDevice[]> {
  const { output } = await xcrunAsync(['xctrace', 'list', 'devices']);

  const text = output.join('');
  const devices: XCTraceDevice[] = [];
  if (!text.includes('== Simulators ==')) {
    return [];
  }

  const lines = text.split('\n');
  for (const line of lines) {
    if (line === '== Simulators ==') {
      break;
    }
    const device = line.match(/(.*?) (\(([0-9.]+)\) )?\(([0-9A-F-]+)\)/i);
    if (device) {
      const [, name, , osVersion, udid] = device;
      const metadata: XCTraceDevice = {
        name,
        udid,
        osVersion: osVersion ?? '??',
        deviceType: osVersion ? 'device' : 'catalyst',
      };

      devices.push(metadata);
    }
  }

  return devices;
}

export async function shutdownAsync(udid?: string) {
  try {
    return simctlAsync(['shutdown', deviceUDIDOrBooted(udid)]);
  } catch (e: any) {
    if (!e.message?.includes('No devices are booted.')) {
      throw e;
    }
  }
  return null;
}

// Some permission changes will terminate the application if running
export async function updatePermissionsAsync(
  udid: string,
  action: 'grant' | 'revoke' | 'reset',
  permission: PermissionName,
  bundleIdentifier?: string
) {
  return simctlAsync(['privacy', deviceUDIDOrBooted(udid), action, permission, bundleIdentifier]);
}

export async function setAppearanceAsync(udid: string, theme: 'light' | 'dark') {
  return simctlAsync(['ui', deviceUDIDOrBooted(udid), theme]);
}

// Cannot be invoked unless the simulator is `shutdown`
export async function eraseAsync(udid: string) {
  return simctlAsync(['erase', deviceUDIDOrBooted(udid)]);
}

export async function eraseAllAsync() {
  return simctlAsync(['erase', 'all']);
}

// Add photos and videos to the simulator's gallery
export async function addMediaAsync(udid: string, mediaPath: string) {
  return simctlAsync(['addmedia', deviceUDIDOrBooted(udid), mediaPath]);
}

export async function captureScreenAsync(
  udid: string,
  captureType: 'screenshot' | 'recordVideo',
  outputFilePath: string
) {
  return simctlAsync([
    'io',
    deviceUDIDOrBooted(udid),
    captureType,
    `—type=${path.extname(outputFilePath)}`,
    outputFilePath,
  ]);
}

// Clear all unused simulators
export async function deleteUnavailableAsync() {
  return simctlAsync(['delete', 'unavailable']);
}

export async function simctlAsync(
  [command, ...args]: (string | undefined)[],
  options?: SpawnOptions
): Promise<SpawnResult> {
  return xcrunWithLogging(
    // @ts-ignore
    ['simctl', command, ...args.filter(Boolean)],
    options
  );
}

function deviceUDIDOrBooted(udid?: string): string {
  return udid ? udid : 'booted';
}

export function isLicenseOutOfDate(text: string) {
  if (!text) {
    return false;
  }

  const lower = text.toLowerCase();
  return lower.includes('xcode') && lower.includes('license');
}

export async function isXcrunInstalledAsync() {
  try {
    execSync('xcrun --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export async function xcrunAsync(args: string[], options?: SpawnOptions) {
  Log.debug('Running: xcrun ' + args.join(' '));
  try {
    return await spawnAsync('xcrun', args, options);
  } catch (e) {
    throw parseXcrunError(e);
  }
}

export function parseXcrunError(e: any): Error {
  if (isLicenseOutOfDate(e.stdout) || isLicenseOutOfDate(e.stderr)) {
    return new CommandError(
      'XCODE_LICENSE_NOT_ACCEPTED',
      'Xcode license is not accepted. Please run `sudo xcodebuild -license`.'
    );
  } else if (e.stderr?.includes('not a developer tool or in PATH')) {
    return new CommandError(
      'SIMCTL_NOT_AVAILABLE',
      `You may need to run ${chalk.bold(
        'sudo xcode-select -s /Applications/Xcode.app'
      )} and try again.`
    );
  }
  // Attempt to craft a better error message...
  if (Array.isArray(e.output)) {
    e.message += '\n' + e.output.join('\n').trim();
  } else if (e.stderr) {
    e.message += '\n' + e.stderr;
  }
  return e;
}

export async function xcrunWithLogging(
  args: string[],
  options?: SpawnOptions
): Promise<SpawnResult> {
  try {
    return await xcrunAsync(args, options);
  } catch (e: any) {
    Log.error(`Error running \`xcrun ${args.join(' ')}\`: ${e.stderr || e.message}`);
    throw e;
  }
}
