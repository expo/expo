import spawnAsync, { SpawnOptions, SpawnResult } from '@expo/spawn-async';
import assert from 'node:assert';
import { xcrunAsync } from './xcrun';
import * as Log from '../../../log';
import { CommandError } from '../../../utils/errors';
import tempy from 'tempy';
import JsonFile from '@expo/json-file';

type DeviceState = 'Shutdown' | 'Booted';

export type OSType = 'iOS' | 'tvOS' | 'watchOS' | 'macOS';

export type Device = {
  availabilityError?: 'runtime profile not found';
  /** '/Users/name/Library/Developer/CoreSimulator/Devices/00E55DC0-0364-49DF-9EC6-77BE587137D4/data' */
  dataPath: string;
  /** @example `2811236352` */
  dataPathSize?: number;
  /** '/Users/name/Library/Logs/CoreSimulator/00E55DC0-0364-49DF-9EC6-77BE587137D4' */
  logPath: string;
  /** @example `479232` */
  logPathSize?: number;
  /** '00E55DC0-0364-49DF-9EC6-77BE587137D4' */
  udid: string;
  /** 'com.apple.CoreSimulator.SimRuntime.iOS-15-1' */
  runtime: string;
  /** If the device is "available" which generally means that the OS files haven't been deleted (this can happen when Xcode updates).  */
  isAvailable: boolean;
  /** 'com.apple.CoreSimulator.SimDeviceType.iPhone-13-Pro' */
  deviceTypeIdentifier: string;
  state: DeviceState;
  /** 'iPhone 13 Pro' */
  name: string;
  /** Type of OS the device uses. */
  osType: OSType;
  /** '15.1' */
  osVersion: string;
  /** 'iPhone 13 Pro (15.1)' */
  windowName: string;
};

type SimulatorDeviceList = {
  devices: {
    [runtime: string]: Device[];
  };
};

type DeviceContext = Pick<Device, 'udid'>;

/** Returns true if the given value is an `OSType`, if we don't recognize the value we continue anyways but warn. */
export function isOSType(value: any): value is OSType {
  if (!value || typeof value !== 'string') return false;

  const knownTypes = ['iOS', 'tvOS', 'watchOS', 'macOS'];
  if (!knownTypes.includes(value)) {
    Log.warn(`Unknown OS type: ${value}. Expected one of: ${knownTypes.join(', ')}`);
  }
  return true;
}

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
    containerPath,
  }: {
    appId: string;
    key: string;
    containerPath?: string;
  }
): Promise<string | null> {
  const ensuredContainerPath = containerPath ?? (await getContainerPathAsync(device, { appId }));
  if (ensuredContainerPath) {
    try {
      const { output } = await spawnAsync(
        'defaults',
        ['read', `${ensuredContainerPath}/Info`, key],
        {
          stdio: 'pipe',
        }
      );
      return output.join('\n').trim();
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
  // Similar to 194, this is a conformance issue which indicates that the given device has no app that can handle our launch request.
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
  } catch (error: any) {
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

/** Returns a list of devices whose current state is 'Booted' as an array. */
export async function getBootedSimulatorsAsync(): Promise<Device[]> {
  const simulatorDeviceInfo = await getRuntimesAsync('devices');
  return Object.values(simulatorDeviceInfo.devices).flatMap((runtime) =>
    runtime.filter((device) => device.state === 'Booted')
  );
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
    if (error.message.includes('Unexpected token')) {
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
  return Object.values(simulatorDeviceInfo.devices).flat();
}

export async function getRealDevicesAsync(): Promise<Device[]> {
  const simulatorDeviceInfo = await getRuntimesAsync('devices');
  return Object.values(simulatorDeviceInfo.devices).flat();
}

/** Run a `simctl` command. */
export async function simctlAsync(
  args: (string | undefined)[],
  options?: SpawnOptions
): Promise<SpawnResult> {
  return xcrunAsync(['simctl', ...args], options);
}

const debug = require('debug')('expo:devicectl') as typeof console.log;

import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { installExitHooks } from '../../../utils/exit';

import { EOL } from 'os';

// cmd: xcrun devicectl device install app --device 00008120-001638590230201E /Users/evanbacon/Library/Developer/Xcode/DerivedData/RouterE2E-hgbqaxzhrhkiftfweydvhgttadvn/Build/Products/Debug-iphoneos/ExpoAI.app
// [stdout] >>> [ '12:42:32  Acquired tunnel connection to device.', '' ]
// [stdout] >>> [ '12:42:32  Enabling developer disk image services.', '' ]
// [stdout] >>> [ '12:42:33  Acquired usage assertion.', '' ]
// [stdout] >>> [ '1%...' ]
// [stdout] >>> [ '2%...' ]
// [stdout] >>> [ '3%...' ]
// [stdout] >>> [ '4%...' ]
// [stdout] >>> [ '5%...' ]
// [stdout] >>> [ '6%...' ]
// [stdout] >>> [ '7%...' ]
// [stdout] >>> [ '8%...' ]
// [stdout] >>> [ '9%...' ]
// [stdout] >>> [ '10%...' ]
// [stdout] >>> [ '11%...' ]
// [stdout] >>> [ '12%...' ]
// [stdout] >>> [ '13%...' ]
// [stdout] >>> [ '14%...' ]
// [stdout] >>> [ '15%...' ]
// [stdout] >>> [ '16%...' ]
// [stdout] >>> [ '18%...' ]
// [stdout] >>> [ '19%...' ]
// [stdout] >>> [ '20%...' ]
// [stdout] >>> [ '21%...' ]
// [stdout] >>> [ '22%...' ]
// [stdout] >>> [ '23%...' ]
// [stdout] >>> [ '24%...' ]
// [stdout] >>> [ '25%...' ]
// [stdout] >>> [ '26%...' ]
// [stdout] >>> [ '27%...' ]
// [stdout] >>> [ '28%...' ]
// [stdout] >>> [ '30%...' ]
// [stdout] >>> [ '31%...' ]
// [stdout] >>> [ '32%...' ]
// [stdout] >>> [ '33%...' ]
// [stdout] >>> [ '34%... 35%...' ]
// [stdout] >>> [ '36%...' ]
// [stdout] >>> [ '37%...' ]
// [stdout] >>> [ '38%...' ]
// [stdout] >>> [ '39%...' ]
// [stdout] >>> [ '40%...' ]
// [stdout] >>> [ '41%...' ]
// [stdout] >>> [ '42%...' ]
// [stdout] >>> [ '43%...' ]
// [stdout] >>> [ '46%...' ]
// [stdout] >>> [ '47%...' ]
// [stdout] >>> [ '48%...' ]
// [stdout] >>> [ '49%...' ]
// [stdout] >>> [ '50%...' ]
// [stdout] >>> [ '51%...' ]
// [stdout] >>> [ '52%...' ]
// [stdout] >>> [ '53%...' ]
// [stdout] >>> [ '54%...' ]
// [stdout] >>> [ '55%...' ]
// [stdout] >>> [ '56%...' ]
// [stdout] >>> [ '57%...' ]
// [stdout] >>> [ '59%...' ]
// [stdout] >>> [ '60%...' ]
// [stdout] >>> [ '62%...' ]
// [stdout] >>> [ '66%...' ]
// [stdout] >>> [ '68%...' ]
// [stdout] >>> [ '72%...' ]
// [stdout] >>> [ '74%...' ]
// [stdout] >>> [ '76%...' ]
// [stdout] >>> [ '80%...' ]
// [stdout] >>> [ '84%...' ]
// [stdout] >>> [ '88%...' ]
// [stdout] >>> [ '92%...' ]
// [stdout] >>> [ '96%...' ]
// [stdout] >>> [ 'Complete!', 'App installed:', '' ]
// [stdout] >>> [
//   '• bundleID: app.bacon.rsc',
//   '• installationURL: file:///private/var/containers/Bundle/Application/4589F1C4-A534-4F27-A682-694C54C66D8C/ExpoAI.app/',
//   '• launchServicesIdentifier: unknown',
//   '• databaseUUID: 9D988F8D-8E2F-4C4A-B57A-69B11F70A7AD',
//   '• databaseSequenceNumber: 5380',
//   '• options:',
//   ''
// ]
// [devicectl close]: 0

export async function installAppWithDeviceCtlAsync(
  uuid: string,
  bundleIdOrAppPath: string,
  onProgress: (event: { status: string; isComplete: boolean; progress: number }) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    // rsc-e2e 𝝠 xcrun devicectl device install app --device 00008120-001638590230201E /Users/evanbacon/Library/Developer/Xcode/DerivedData/RouterE2E-hgbqaxzhrhkiftfweydvhgttadvn/Build/Products/Debug-iphoneos/ExpoAI.app --verbose

    // xcrun simctl spawn booted log stream --process --style json
    const childProcess = spawn('xcrun', [
      'devicectl',
      'device',
      'install',
      'app',
      '--device',
      uuid,
      bundleIdOrAppPath,
    ]);
    debug('xcrun devicectl device install app --device', uuid, bundleIdOrAppPath);

    let currentProgress = 0;
    let hasStarted = false;

    function updateProgress(progress: number) {
      hasStarted = true;
      if (progress <= currentProgress) {
        return;
      }
      currentProgress = progress;
      onProgress({
        progress,
        isComplete: progress === 100,
        status: 'Installing',
      });
    }

    childProcess.stdout.on('data', (data: Buffer) => {
      // Sometimes more than one chunk comes at a time, here we split by system newline,
      // then trim and filter.
      const strings = data
        .toString()
        .split(EOL)
        .map((value) => value.trim());

      strings.forEach((str) => {
        // Match the progress percentage:
        // - '34%... 35%...' -> 35
        // - '31%...' -> 31
        // - 'Complete!' -> 100

        const match = str.match(/(\d+)%\.\.\./);
        if (match) {
          updateProgress(parseInt(match[1], 10));
        } else if (hasStarted) {
          updateProgress(100);
        }
      });

      debug('[stdout]', strings);
    });

    childProcess.on('close', (code) => {
      debug('[devicectl close]: ' + code);
      if (code === 0) {
        resolve();
      } else {
        const stderr = childProcess.stderr.read();
        const err = new Error(stderr);
        (err as any).code = code;
        detach(err);
      }
    });

    const detach = async (err?: Error) => {
      off?.();
      if (childProcess) {
        return new Promise<void>((resolve) => {
          childProcess?.on('close', resolve);
          childProcess?.kill();
          // childProcess = null;
          reject(err ?? new Error('Detached'));
        });
      }
    };

    const off = installExitHooks(() => detach());
  });
}

/** Run a `devicectl` command. */
export async function devicectlAsync(
  args: (string | undefined)[],
  options?: SpawnOptions
): Promise<SpawnResult> {
  return xcrunAsync(['devicectl', ...args], options);
}

export async function getConnectedAppleDevicesAsync() {
  const tmpPath = tempy.file();
  const devices = await devicectlAsync([
    'list',
    'devices',
    '--json-output',
    tmpPath,
    // Give two seconds before timing out: between 5 and 9223372036854775807
    '--timeout',
    '5',
  ]);
  debug(devices.stdout);
  const devicesJson = await JsonFile.readAsync(tmpPath);

  if ((devicesJson as any)?.info?.jsonVersion !== 2) {
    Log.warn(
      'Unexpected devicectl JSON version output from devicectl. Connecting to physical Apple devices may not work as expected.'
    );
  }

  assertDevicesJson(devicesJson);

  const results = devicesJson.result.devices as DeviceCtlDevice[];
  return results;
}

function assertDevicesJson(
  results: any
): asserts results is { result: { devices: DeviceCtlDevice[] } } {
  assert(
    results != null && 'result' in results && Array.isArray(results?.result?.devices),
    'Malformed JSON output from devicectl: ' + JSON.stringify(results, null, 2)
  );
}

function resolveId(device: Partial<DeviceContext>): string {
  return device.udid ?? 'booted';
}

type AnyEnum<T extends string = string> = T | (string & {});

type DeviceCtlDevice = {
  capabilities: DeviceCtlDeviceCapability[];
  connectionProperties: DeviceCtlConnectionProperties;
  deviceProperties: DeviceCtlDeviceProperties;
  hardwareProperties: DeviceCtlHardwareProperties;
  /** "A1A1AAA1-0011-1AA1-11A1-10A1111AA11A" */
  identifier: string;
  visibilityClass: AnyEnum<'default'>;
};

type DeviceCtlHardwareProperties = {
  cpuType: DeviceCtlCpuType;
  deviceType: AnyEnum<'iPhone'>;
  /** 6254404427587614 */
  ecid: number;
  /** "D74AP" */
  hardwareModel: string;
  /** 512000000000 */
  internalStorageCapacity: number;
  /** true */
  isProductionFused: boolean;
  /** "iPhone 14 Pro Max" */
  marketingName: string;
  /** "iOS" */
  platform: string;
  /** "iPhone15,3" */
  productType: AnyEnum<'iPhone13,4' | 'iPhone15,3'>;
  reality: AnyEnum<'physical'>;
  /** "X2X1CC1XXX" */
  serialNumber: string;
  supportedCPUTypes: DeviceCtlCpuType[];
  /** [1] */
  supportedDeviceFamilies: number[];
  thinningProductType: AnyEnum<'iPhone15,3'>;
  /** "00001110-001111110110101A" */
  udid: string;
};

type DeviceCtlDeviceProperties = {
  /** true */
  bootedFromSnapshot: boolean;
  /** "com.apple.os.update-AD0CF991ACFF92A64166A76A3D1262AE42A3F56F305AF5AE1935393A7A14A7D3" */
  bootedSnapshotName: string;
  /** false */
  ddiServicesAvailable: boolean;

  developerModeStatus: AnyEnum<'enabled'>;
  /** false */
  hasInternalOSBuild: boolean;
  /** "Evan's phone" */
  name: string;
  /** "21E236" */
  osBuildUpdate: string;
  /** "17.4.1" */
  osVersionNumber: string;
  /** false */
  rootFileSystemIsWritable: boolean;
};

type DeviceCtlDeviceCapability =
  | {
      name: string & {};
      featureIdentifier: string & {};
    }
  | {
      featureIdentifier: 'com.apple.coredevice.feature.connectdevice';
      name: 'Connect to Device';
    }
  | {
      featureIdentifier: 'com.apple.coredevice.feature.unpairdevice';
      name: 'Unpair Device';
    }
  | {
      featureIdentifier: 'com.apple.coredevice.feature.acquireusageassertion';
      name: 'Acquire Usage Assertion';
    };

type DeviceCtlConnectionProperties = {
  authenticationType: AnyEnum<'manualPairing'>;
  isMobileDeviceOnly: boolean;
  /** "2024-04-20T22:50:04.244Z" */
  lastConnectionDate: string;
  pairingState: AnyEnum<'paired'>;
  /** ["00008120-001638590230201E.coredevice.local", "B3F9CFC2-0043-4EB7-98B2-10A4353DD31E.coredevice.local"] */
  potentialHostnames: string[];
  transportType: AnyEnum<'localNetwork'>;
  tunnelState: AnyEnum<'disconnected'>;
  tunnelTransportProtocol: AnyEnum<'tcp'>;
};

type DeviceCtlCpuType = {
  name: AnyEnum<'arm64e' | 'arm64' | 'arm64_32'>;
  subType: number;
  /** 16777228 */
  type: number;
};
