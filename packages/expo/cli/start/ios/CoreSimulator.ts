import fs from 'fs';
import { boolish } from 'getenv';
import { sync as globSync } from 'glob';
import os from 'os';
import path from 'path';

import * as Log from '../../log';
import { parseBinaryPlistAsync } from '../../utils/plist';
import { SimulatorDevice } from './SimControl';

// Enable this to test the JS version of simctl
const EXPO_USE_CORE_SIM = boolish('EXPO_USE_CORE_SIM', false);

export function isEnabled() {
  return EXPO_USE_CORE_SIM;
}

enum DeviceState {
  BOOTED = 3,
  SHUTDOWN = 1,
}

export class CoreSimulatorError extends Error {
  constructor(public message: string, public code?: 'MALFORMED_BINARY' | 'INVALID_UDID') {
    super(message);
  }
}

/**
 * CoreSimulator devices folder.
 *
 * @returns /Users/evanbacon/Library/Developer/CoreSimulator/Devices
 */
function getDevicesDirectory(): string {
  return path.join(os.homedir(), '/Library/Developer/CoreSimulator/Devices/');
}

/**
 * CoreSimulator device folder, asserts when the device is invalid.
 *
 * @param props.udid device udid. Cannot be `booted`.
 * @returns /Users/evanbacon/Library/Developer/CoreSimulator/Devices/EFEEA6EF-E3F5-4EDE-9B72-29EAFA7514AE/
 */
async function getDirectoryForDeviceAsync(udid: string): Promise<string> {
  const deviceFolder = path.join(getDevicesDirectory(), udid);

  // Invalid udid (no matching device)
  if (!fs.existsSync(deviceFolder)) {
    const possibleUdids = await getDirectoriesAsync(getDevicesDirectory());
    let errorMessage = `Invalid iOS Simulator device UDID: ${udid}.`;
    if (possibleUdids.length) {
      errorMessage += ` Expected one of: ${possibleUdids.join(', ')}`;
    }
    throw new CoreSimulatorError(errorMessage, 'INVALID_UDID');
  }
  return deviceFolder;
}

async function resolveUdidAsync(udid: string): Promise<string> {
  if (udid === 'booted') {
    const bootedDevice = await getBootedDeviceAsync();
    if (!bootedDevice) {
      throw new CoreSimulatorError('No devices are booted.', 'INVALID_UDID');
    }
    udid = bootedDevice.UDID;
    Log.debug('Resolved booted device: ' + udid);
  }
  return udid;
}

export async function listDevicesAsync(): Promise<SimulatorDevice[]> {
  const devicesDirectory = getDevicesDirectory();
  const devices = await getDirectoriesAsync(devicesDirectory);

  return (
    await Promise.all(
      devices.map(async (device): Promise<SimulatorDevice | null> => {
        const plistPath = path.join(devicesDirectory, device, 'device.plist');
        if (!fs.existsSync(plistPath)) return null;
        // The plist is stored in binary format
        const data = await parseBinaryPlistAsync(plistPath);
        return devicePlistToSimulatorDevice(devicesDirectory, data);
      })
    )
  ).filter(Boolean) as SimulatorDevice[];
}

export async function getDeviceInfoAsync({
  udid,
}: { udid?: string } = {}): Promise<SimulatorDevice> {
  if (!udid || udid === 'booted') {
    const bootedDevice = await getBootedDeviceAsync();
    if (!bootedDevice) {
      throw new CoreSimulatorError('No devices are booted.', 'INVALID_UDID');
    }
    const deviceDirectory = await getDirectoryForDeviceAsync(bootedDevice.UDID);
    return devicePlistToSimulatorDevice(deviceDirectory, bootedDevice);
  }

  const deviceDirectory = await getDirectoryForDeviceAsync(udid);
  const plistPath = path.join(deviceDirectory, 'device.plist');
  // The plist is stored in binary format
  const data = await parseBinaryPlistAsync(plistPath);
  return devicePlistToSimulatorDevice(deviceDirectory, data);
}

export function devicePlistToSimulatorDevice(deviceDirectory: string, data: any): SimulatorDevice {
  const runtimeSuffix = data.runtime.split('com.apple.CoreSimulator.SimRuntime.').pop()!;
  // Create an array [tvOS, 13, 4]
  const [osType, ...osVersionComponents] = runtimeSuffix.split('-');
  // Join the end components [13, 4] -> '13.4'
  const osVersion = osVersionComponents.join('.');
  return {
    ...data,
    /**
     * '/Users/name/Library/Developer/CoreSimulator/Devices/00E55DC0-0364-49DF-9EC6-77BE587137D4/data'
     */
    dataPath: path.join(deviceDirectory, 'data'),
    /**
     * '/Users/name/Library/Logs/CoreSimulator/00E55DC0-0364-49DF-9EC6-77BE587137D4'
     */
    logPath: path.join(os.homedir(), 'Library/Logs/CoreSimulator', data.UDID),
    /**
     * '00E55DC0-0364-49DF-9EC6-77BE587137D4'
     */
    udid: data.UDID,
    /**
     * com.apple.CoreSimulator.SimRuntime.tvOS-13-4
     */
    runtime: data.runtime,
    isAvailable: !data.isDeleted,
    /**
     * 'com.apple.CoreSimulator.SimDeviceType.Apple-TV-1080p'
     */
    deviceTypeIdentifier: data.deviceType,
    state: data.state === DeviceState.BOOTED ? 'Booted' : 'Shutdown',
    /**
     * 'Apple TV'
     */
    name: data.name,

    /**
     * 'iOS'
     */
    osType: osType as SimulatorDevice['osType'],
    /**
     * '13.4'
     */
    osVersion,
    /**
     * 'iPhone 11 (13.6)'
     */
    windowName: `${data.name} (${osVersion})`,

    // Compare state stored under `state` to 3 (booted)
    isBooted: data.state === DeviceState.BOOTED,
  };
}

/**
 * Get UDID for the first booted simulator. It's unclear if this is the exact method used by  `xcrun simctl` to determine which device is "booted".
 *
 * @returns EFEEA6EF-E3F5-4EDE-9B72-29EAFA7514AE
 */
export async function getBootedDeviceAsync(): Promise<{ UDID: string } | null> {
  const devicesDirectory = getDevicesDirectory();
  const devices = await getDirectoriesAsync(devicesDirectory);

  // parallelize searching for the matching app
  return new Promise<{ UDID: string } | null>(async (resolve, reject) => {
    let complete: boolean = false;
    try {
      await Promise.all(
        devices.map(async (device) => {
          if (complete) return;
          const plistPath = path.join(devicesDirectory, device, 'device.plist');
          // The plist is stored in binary format
          const data = await parseBinaryPlistAsync(plistPath);
          // Compare state stored under `state` to 3 (booted)
          if (data.state === DeviceState.BOOTED) {
            complete = true;
            resolve(data);
          }
        })
      );
      if (!complete) {
        resolve(null);
      }
    } catch (error) {
      if (!complete) {
        reject(error);
      }
    }
  });
}

/**
 * Returns the local path for the installed binary.app on a given Apple simulator. Returns null when the app isn't installed.
 *
 * This can be used as a replacement for `xcrun simctl get_app_container <udid> <bundleIdentifier>` but it's over 200x faster.
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
  udid = await resolveUdidAsync(udid);
  // Like: `/Users/evanbacon/Library/Developer/CoreSimulator/Devices/EFEEA6EF-E3F5-4EDE-9B72-29EAFA7514AE/data/Containers/Bundle/Application/`
  // TODO: Maybe shallow glob for `.com.apple.mobile_container_manager.metadata.plist` to find apps faster
  const appsFolder = path.join(
    await getDirectoryForDeviceAsync(udid),
    'data/Containers/Bundle/Application'
  );

  // Get all apps for a device
  // Like: `['FA43A0C6-C2AD-442D-B8B1-EAF3E88CF3BF']`
  const apps = await getDirectoriesAsync(appsFolder);

  // parallelize searching for the matching app
  return new Promise<string | null>(async (resolve, reject) => {
    let complete: boolean = false;
    try {
      await Promise.all(
        apps.map(async (app) => {
          if (complete) return;
          const appFolder = path.join(appsFolder, app);
          const plistPath = path.join(
            appFolder,
            '.com.apple.mobile_container_manager.metadata.plist'
          );
          // The plist is stored in binary format
          const data = await parseBinaryPlistAsync(plistPath);
          // Compare bundle identifier stored under `MCMMetadataIdentifier`
          if (data.MCMMetadataIdentifier === bundleIdentifier) {
            // Find .app file in the app folder
            const binaryPath = findBinaryFileInDirectory(appFolder);
            if (!binaryPath) {
              throw new CoreSimulatorError(
                `Found matching app container at "${appFolder}" but binary (*.app file) is missing.`,
                'MALFORMED_BINARY'
              );
            }
            complete = true;
            resolve(binaryPath);
          }
        })
      );
      if (!complete) {
        resolve(null);
      }
    } catch (error) {
      if (!complete) {
        reject(error);
      }
    }
  });
}

function findBinaryFileInDirectory(folder: string) {
  // Find .app file in the app folder
  const binaryPath = globSync('*.app', {
    absolute: true,
    cwd: folder,
  })[0];

  return binaryPath || null;
}

async function getDirectoriesAsync(directory: string) {
  return (await fs.promises.readdir(directory, { withFileTypes: true }).catch(() => []))
    .filter((device) => device.isDirectory())
    .map((device) => device.name);
}
