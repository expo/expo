import spawnAsync, { SpawnOptions, SpawnResult } from '@expo/spawn-async';
import { execSync } from 'child_process';

import * as Log from '../../../log';
import { CommandError } from '../../../utils/errors';
import { xcrunAsync } from './xcrun';

type DeviceState = 'Shutdown' | 'Booted';

type OSType = 'iOS' | 'tvOS' | 'watchOS' | 'macOS';

export type Device = {
  availabilityError?: 'runtime profile not found';
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
   * 'com.apple.CoreSimulator.SimRuntime.tvOS-13-4'
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

type SimulatorDeviceList = {
  devices: {
    [runtime: string]: Device[];
  };
};

type DeviceContext = Pick<Device, 'udid'>;

/**
 * Returns the local path for the installed tar.app. Returns null when the app isn't installed.
 *
 * @param device context for selecting a device.
 * @param props.appId bundle identifier for app.
 * @returns local file path to installed app binary, e.g. '/Users/evanbacon/Library/Developer/CoreSimulator/Devices/EFEEA6EF-E3F5-4EDE-9B72-29EAFA7514AE/data/Containers/Bundle/Application/FA43A0C6-C2AD-442D-B8B1-EAF3E88CF3BF/Exponent-2.21.3.tar.app'
 */
export async function getContainerPathAsync(
  device: Partial<DeviceContext>,
  {
    appId,
  }: {
    appId: string;
  }
): Promise<string | null> {
  try {
    const { stdout } = await simctlAsync(['get_app_container', resolveId(device), appId]);
    return stdout.trim();
  } catch (error: any) {
    if (error.stderr?.match(/No such file or directory/)) {
      return null;
    }
    throw error;
  }
}

/** Return a value from an installed app's Info.plist. */
export async function getInfoPlistValueAsync(
  device: Partial<DeviceContext>,
  {
    appId,
    key,
  }: {
    appId: string;
    key: string;
  }
): Promise<string | null> {
  const containerPath = await getContainerPathAsync(device, { appId });
  if (containerPath) {
    try {
      const defaultDeviceUDID = execSync(`defaults read ${containerPath}/Info ${key}`, {
        stdio: 'pipe',
      }).toString();
      return defaultDeviceUDID.trim();
    } catch {
      return null;
    }
  }
  return null;
}

/** Open a URL on a device. The url can have any protocol. */
export async function openUrlAsync(
  device: Partial<DeviceContext>,
  options: { url: string }
): Promise<void> {
  try {
    // Skip logging since this is likely to fail.
    await simctlAsync(['openurl', resolveId(device), options.url]);
  } catch (error: any) {
    if (!error.stderr?.match(/Unable to lookup in current state: Shut/)) {
      throw error;
    }

    // If the device was in a weird in-between state ("Shutting Down" or "Shutdown"), then attempt to reboot it and try again.
    // This can happen when quitting the Simulator app, and immediately pressing `i` to reopen the project.

    // First boot the simulator
    await bootDeviceAsync({ udid: resolveId(device) });

    // Finally, try again...
    return await openUrlAsync(device, options);
  }
}

/** Open a simulator using a bundle identifier. If no app with a matching bundle identifier is installed then an error will be thrown. */
export async function openAppIdAsync(
  device: Partial<DeviceContext>,
  options: {
    appId: string;
  }
): Promise<SpawnResult> {
  const results = await openAppIdInternalAsync(device, options);
  if (results.status === 4) {
    throw new CommandError('APP_NOT_INSTALLED', results.stderr);
  }
  return results;
}
async function openAppIdInternalAsync(
  device: Partial<DeviceContext>,
  options: {
    appId: string;
  }
): Promise<SpawnResult> {
  try {
    return await simctlAsync(['launch', resolveId(device), options.appId]);
  } catch (error) {
    if ('status' in error) {
      return error;
    }
    throw error;
  }
}

// This will only boot in headless mode if the Simulator app is not running.
export async function bootAsync(device: DeviceContext): Promise<Device | null> {
  await bootDeviceAsync(device);
  return isDeviceBootedAsync(device);
}

/** Returns a list of devices which current state is 'Booted' as an array. */
export async function getBootedSimulatorsAsync(): Promise<Device[]> {
  const simulatorDeviceInfo = await getRuntimesAsync('devices');
  return Object.values(simulatorDeviceInfo.devices).reduce((prev, runtime) => {
    return prev.concat(runtime.filter((device) => device.state === 'Booted'));
  }, []);
}

/** Returns the current device if its state is 'Booted'. */
export async function isDeviceBootedAsync(device: Partial<DeviceContext>): Promise<Device | null> {
  // Simulators can be booted even if the app isn't running :(
  const devices = await getBootedSimulatorsAsync();
  if (device.udid) {
    return devices.find((bootedDevice) => bootedDevice.udid === device.udid) ?? null;
  }

  return devices[0] ?? null;
}

/** Boot a device. */
export async function bootDeviceAsync(device: DeviceContext): Promise<void> {
  try {
    // Skip logging since this is likely to fail.
    await simctlAsync(['boot', device.udid]);
  } catch (error: any) {
    if (!error.stderr?.match(/Unable to boot device in current state: Booted/)) {
      throw error;
    }
  }
}

/** Install a binary file on the device. */
export async function installAsync(
  device: Partial<DeviceContext>,
  options: {
    /** Local absolute file path to an app binary that is built and provisioned for iOS simulators. */
    filePath: string;
  }
): Promise<any> {
  return simctlAsync(['install', resolveId(device), options.filePath]);
}

/** Uninstall an app from the provided device. */
export async function uninstallAsync(
  device: Partial<DeviceContext>,
  options: {
    /** Bundle identifier */
    appId: string;
  }
): Promise<any> {
  return simctlAsync(['uninstall', resolveId(device), options.appId]);
}

function parseSimControlJSONResults(input: string): any {
  try {
    return JSON.parse(input);
  } catch (error: any) {
    // Nov 15, 2020: Observed this can happen when opening the simulator and the simulator prompts the user to update the xcode command line tools.
    // Unexpected token I in JSON at position 0
    if (error.message.match('Unexpected token')) {
      Log.error(`Apple's simctl returned malformed JSON:\n${input}`);
    }
    throw error;
  }
}

/** Get all runtime devices given a certain type. */
async function getRuntimesAsync(
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

/** Return a list of iOS simulators. */
export async function getDevicesAsync(): Promise<Device[]> {
  const simulatorDeviceInfo = await getRuntimesAsync('devices');
  return Object.values(simulatorDeviceInfo.devices).reduce(
    (prev, runtime) => prev.concat(runtime),
    []
  );
}

/** Run a `simctl` command. */
export async function simctlAsync(
  args: (string | undefined)[],
  options?: SpawnOptions
): Promise<SpawnResult> {
  return xcrunAsync(['simctl', ...args], options);
}

function resolveId(device: Partial<DeviceContext>): string {
  return device.udid ?? 'booted';
}
