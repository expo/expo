import chalk from 'chalk';

import * as Log from '../../../log';
import { env } from '../../../utils/env';
import { CommandError } from '../../../utils/errors';
import { learnMore } from '../../../utils/link';
import { ora } from '../../../utils/ora';
import { event } from '../events';
import { ADBServer } from './ADBServer';
import { isAdbDeviceStateUsable, parseAdbDeviceList } from './adbDeviceList';
import { createAdbOperationErrorAsync, formatAdbDiscoveryError } from './adbDiagnostics';
import {
  ADB_HOST_PROBE_WAIT_LIMIT_MS,
  AdbHostProbeResult,
  probeAdbHostVersionAsync,
  resolveAdbEndpoint,
} from './adbEndpoint';

export enum DeviceABI {
  // The arch specific android target platforms are soft-deprecated.
  // Instead of using TargetPlatform as a combination arch + platform
  // the code will be updated to carry arch information in [DarwinArch]
  // and [AndroidArch].
  arm = 'arm',
  arm64 = 'arm64',
  x64 = 'x64',
  x86 = 'x86',
  x8664 = 'x86_64',
  arm64v8a = 'arm64-v8a',
  armeabiV7a = 'armeabi-v7a',
  armeabi = 'armeabi',
  universal = 'universal',
}

/** Represents a connected Android device. */
export type Device = {
  /** Process ID. */
  pid?: string;
  /** Name of the device, also used as the ID for opening devices. */
  name: string;
  /** Is emulator or connected device. */
  type: 'emulator' | 'device';
  /** Is the device booted (emulator). */
  isBooted: boolean;
  /** Is device authorized for developing. https://expo.fyi/authorize-android-device */
  isAuthorized: boolean;
  /** The connection type to ADB, only available when `type: device` */
  connectionType?: 'USB' | 'Network';
  /** Raw state reported by ADB. Absent for an AVD that is not attached. */
  state?: string;
  /** Stable transport identity reported by `adb devices -l`, when available. */
  transportId?: string;
  /** Whether Expo may launch this inventory record with `emulator @name`. */
  isLaunchable?: boolean;
};

type DeviceContext = Pick<Device, 'pid'>;

type DeviceProperties = Record<string, string>;

const CANT_START_ACTIVITY_ERROR = 'Activity not started, unable to resolve Intent';
// http://developer.android.com/ndk/guides/abis.html
const PROP_CPU_NAME = 'ro.product.cpu.abi';

const PROP_CPU_ABI_LIST_NAME = 'ro.product.cpu.abilist';

// Can sometimes be null
// http://developer.android.com/ndk/guides/abis.html
const PROP_BOOT_ANIMATION_STATE = 'init.svc.bootanim';
const DEVICE_DISCOVERY_WAIT_LIMIT_MS = 10_000;

let _server: ADBServer | null;

/** Return the lazily loaded ADB server instance. */
export function getServer() {
  _server ??= new ADBServer();
  return _server;
}

/** Logs an FYI message about authorizing your device. */
export function logUnauthorized(device: Device) {
  Log.warn(
    `\nThis computer is not authorized for developing on ${chalk.bold(device.name)}. ${chalk.dim(
      learnMore('https://expo.fyi/authorize-android-device')
    )}`
  );
}

/** Returns true if the provided package name is installed on the provided Android device. */
export async function isPackageInstalledAsync(
  device: DeviceContext,
  androidPackage: string,
  signal?: AbortSignal
): Promise<boolean> {
  const packages = await getServer().runDeviceQueryAsync(
    adbShellArgs(device.pid, 'pm', 'list', 'packages', '--user', env.EXPO_ADB_USER, androidPackage),
    'package query',
    signal
  );

  const lines = packages.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (line === `package:${androidPackage}`) {
      return true;
    }
  }
  return false;
}

/**
 * @param device.pid Process ID of the Android device to launch.
 * @param props.launchActivity Activity to launch `[application identifier]/.[main activity name]`, ex: `com.bacon.app/.MainActivity`
 * @param props.url Optional (dev client) URL to launch
 */
export async function launchActivityAsync(
  device: DeviceContext,
  {
    launchActivity,
    url,
  }: {
    launchActivity: string;
    url?: string;
  },
  signal?: AbortSignal
) {
  const command: string[] = [
    'am',
    'start',
    // FLAG_ACTIVITY_SINGLE_TOP -- If set, the activity will not be launched if it is already running at the top of the history stack.
    '-f',
    '0x20000000',
    // Activity to open first: com.bacon.app/.MainActivity
    '-n',
    launchActivity,
  ];

  if (url) {
    command.push('-d', url);
  }

  return openAsync(adbShellArgs(device.pid, ...command), 'activity launch', signal);
}

/**
 * @param device.pid Process ID of the Android device to launch.
 * @param props.url URL to launch.
 */
export async function openUrlAsync(
  device: DeviceContext,
  {
    url,
  }: {
    url: string;
  },
  signal?: AbortSignal
) {
  return openAsync(
    adbShellArgs(device.pid, 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', url),
    'URL launch',
    signal
  );
}

/** Runs a generic command watches for common errors in order to throw with an expected code. */
async function openAsync(args: string[], operation: string, signal?: AbortSignal): Promise<string> {
  let results: string;
  try {
    results = await getServer().runDeviceMutationAsync(args, operation, signal);
  } catch (error) {
    const output =
      error && typeof error === 'object'
        ? [
            'stdout' in error ? error.stdout : undefined,
            'stderr' in error ? error.stderr : undefined,
            error instanceof Error ? error.message : undefined,
          ]
            .filter((value): value is string => typeof value === 'string')
            .join('\n')
        : String(error);
    if (isMissingActivityOutput(output)) {
      throw new CommandError('APP_NOT_INSTALLED', extractActivityError(output));
    }
    throw error;
  }
  if (isMissingActivityOutput(results)) {
    throw new CommandError('APP_NOT_INSTALLED', extractActivityError(results));
  }
  return results;
}

function isMissingActivityOutput(output: string): boolean {
  return (
    output.includes(CANT_START_ACTIVITY_ERROR) ||
    /Error: Activity class .* does not exist\./.test(output)
  );
}

function extractActivityError(output: string): string {
  const errorIndex = output.indexOf('Error: ');
  return errorIndex >= 0 ? output.substring(errorIndex) : output;
}

/** Uninstall an app given its Android package name. */
export async function uninstallAsync(
  device: DeviceContext,
  { appId }: { appId: string },
  signal?: AbortSignal
): Promise<string> {
  return await getServer().runDeviceMutationAsync(
    adbArgs(device.pid, 'uninstall', '--user', env.EXPO_ADB_USER, appId),
    'app uninstall',
    signal
  );
}

/** Get package info from an app based on its Android package name. */
export async function getPackageInfoAsync(
  device: DeviceContext,
  { appId }: { appId: string },
  signal?: AbortSignal
): Promise<string> {
  return await getServer().runDeviceQueryAsync(
    adbShellArgs(device.pid, 'dumpsys', 'package', appId),
    'package info query',
    signal
  );
}

/** Install an app on a connected device. */
export async function installAsync(
  device: DeviceContext,
  { filePath }: { filePath: string },
  signal?: AbortSignal
) {
  // TODO: Handle the `INSTALL_FAILED_INSUFFICIENT_STORAGE` error.
  return await getServer().runDeviceMutationAsync(
    adbArgs(device.pid, 'install', '-r', '-d', '--user', env.EXPO_ADB_USER, filePath),
    'app install',
    signal
  );
}

/** Format ADB args with process ID. */
export function adbArgs(pid: Device['pid'], ...options: string[]): string[] {
  const args = [];
  if (pid) {
    args.push('-s', pid);
  }

  return args.concat(options);
}

/**
 * `adb shell` concatenates trailing args and runs the result through `sh -c` on
 * the device, so unquoted metacharacters in tainted tokens execute on-device.
 */
export function adbShellArgs(pid: Device['pid'], ...command: string[]): string[] {
  return adbArgs(pid, 'shell', ...command.map(shellQuote));
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

// TODO: This is very expensive for some operations.
export async function getAttachedDevicesAsync({
  server = getServer(),
  signal,
  waitLimitMs,
  probeWaitLimitMs = ADB_HOST_PROBE_WAIT_LIMIT_MS,
  shouldShowWaitingMessage = false,
}: {
  server?: ADBServer;
  signal?: AbortSignal;
  waitLimitMs?: number;
  probeWaitLimitMs?: number;
  shouldShowWaitingMessage?: boolean;
} = {}): Promise<Device[]> {
  const discoveryWaitLimitMs = waitLimitMs ?? DEVICE_DISCOVERY_WAIT_LIMIT_MS;
  const waitSignal = AbortSignal.timeout(discoveryWaitLimitMs);
  const operationSignal = signal ? AbortSignal.any([signal, waitSignal]) : waitSignal;
  const endpoint = resolveAdbEndpoint();
  const spinner = shouldShowWaitingMessage ? ora('Waiting for ADB device discovery').start() : null;

  try {
    const output = await server.runHostQueryAsync(
      ['devices', '-l'],
      'device discovery',
      signal,
      discoveryWaitLimitMs
    );
    return await parseAttachedDevicesAsync(output, operationSignal);
  } catch (error) {
    // Caller cancellation is not a discovery failure, so skip the diagnostic probe
    if (signal?.aborted && error === signal.reason) {
      throw error;
    }

    let hostProbe: AdbHostProbeResult;
    try {
      const probeSignal = AbortSignal.timeout(probeWaitLimitMs);
      hostProbe = await probeAdbHostVersionAsync(endpoint, probeSignal);
    } catch {
      hostProbe = {
        kind: 'connection-failure',
      };
    }
    throw new CommandError('ADB_DISCOVERY', formatAdbDiscoveryError(error, endpoint, hostProbe));
  } finally {
    spinner?.stop();
  }
}

async function parseAttachedDevicesAsync(output: string, signal: AbortSignal): Promise<Device[]> {
  return Promise.all(
    parseAdbDeviceList(output).map(async (record): Promise<Device> => {
      // unauthorized: ['FA8251A00719', 'unauthorized', 'usb:338690048X', 'transport_id:5']
      // authorized: ['FA8251A00719', 'device', 'usb:336592896X', 'product:walleye', 'model:Pixel_2', 'device:walleye', 'transport_id:4']
      // emulator: ['emulator-5554', 'offline', 'transport_id:1']
      const type: Device['type'] = /^emulator-\d+$/.test(record.serial) ? 'emulator' : 'device';

      const connectionType: Device['connectionType'] =
        type !== 'device'
          ? undefined
          : record.metadata.some((field) => field.startsWith('usb:'))
            ? 'USB'
            : record.serial.includes('_adb-tls-connect.')
              ? 'Network'
              : undefined;

      const { serial: pid, state, transportId, metadata: deviceInfo } = record;
      const isUsable = isAdbDeviceStateUsable(state);

      let name: string;
      if (type === 'device') {
        // Unauthorized devices do not report model metadata.
        const model = isUsable
          ? deviceInfo.find((field) => field.startsWith('model:'))?.slice('model:'.length)
          : undefined;
        name = model || `Device ${pid}`;
      } else if (isUsable) {
        // Given a usable emulator pid, get the AVD name for matching the attached transport.
        name = (await getAdbNameForDeviceIdAsync({ pid }, signal)) ?? '';
      } else {
        name = `Device ${pid}`;
      }

      return {
        pid,
        name,
        type,
        isAuthorized: isUsable,
        isBooted: isUsable,
        isLaunchable: false,
        state,
        transportId,
        connectionType,
      };
    })
  );
}

/**
 * Return the Emulator name for an emulator ID, this can be used to determine if an emulator is booted.
 *
 * @param device.pid a value like `emulator-5554` from `abd devices`
 */
export async function getAdbNameForDeviceIdAsync(
  device: DeviceContext,
  signal?: AbortSignal
): Promise<string | null> {
  const results = await getServer().runDeviceQueryAsync(
    adbArgs(device.pid, 'emu', 'avd', 'name'),
    'emulator name query',
    signal
  );

  if (results.match(/could not connect to TCP port .*: Connection refused/)) {
    // Can also occur when the emulator does not exist.
    throw new CommandError('EMULATOR_NOT_FOUND', results);
  }

  return sanitizeAdbDeviceName(results) ?? null;
}

export async function isDeviceBootedAsync({
  pid,
  name,
}: Partial<Pick<Device, 'pid' | 'name'>> = {}): Promise<Device | null> {
  const devices = await getAttachedDevicesAsync();

  if (pid) return devices.find((device) => device.pid === pid) ?? null;
  if (name) return devices.find((device) => device.name === name) ?? null;
  return devices[0] ?? null;
}

/**
 * Returns true when a device's splash screen animation has stopped.
 * This can be used to detect when a device is fully booted and ready to use.
 *
 * @param pid
 */
export async function isBootAnimationCompleteAsync(
  pid?: string,
  signal?: AbortSignal
): Promise<boolean> {
  const props = await getPropertyDataForDeviceAsync({ pid }, PROP_BOOT_ANIMATION_STATE, signal);
  return !!props[PROP_BOOT_ANIMATION_STATE]?.match(/stopped/);
}

/** Get a list of ABIs for the provided device. */
export async function getDeviceABIsAsync(
  device: Pick<Device, 'name' | 'pid'>
): Promise<DeviceABI[]> {
  const cpuAbiList = (await getPropertyDataForDeviceAsync(device, PROP_CPU_ABI_LIST_NAME))[
    PROP_CPU_ABI_LIST_NAME
  ];

  if (cpuAbiList) {
    return cpuAbiList.trim().split(',') as DeviceABI[];
  }

  const abi = (await getPropertyDataForDeviceAsync(device, PROP_CPU_NAME))[
    PROP_CPU_NAME
  ] as DeviceABI;
  return [abi];
}

export async function getPropertyDataForDeviceAsync(
  device: DeviceContext,
  prop?: string,
  signal?: AbortSignal
): Promise<DeviceProperties> {
  const propCommand = prop
    ? adbShellArgs(device.pid, 'getprop', prop)
    : adbShellArgs(device.pid, 'getprop');
  try {
    const results = await getServer().getFileOutputAsync(propCommand, {
      signal,
    });
    // Like:
    // [wifi.direct.interface]: [p2p-dev-wlan0]
    // [wifi.interface]: [wlan0]

    if (prop) {
      event('adb_property_data', {
        devicePid: device.pid,
        prop,
        data: results,
      });
      return {
        [prop]: results,
      };
    }
    const props = parseAdbDeviceProperties(results);

    event('adb_parsed_properties', { props });

    return props;
  } catch (error: any) {
    throw await createAdbOperationErrorAsync('ADB_PROPERTY', error, device);
  }
}

function parseAdbDeviceProperties(devicePropertiesString: string) {
  const properties: DeviceProperties = {};
  const propertyExp = /\[(.*?)\]: \[(.*?)\]/gm;
  for (const match of devicePropertiesString.matchAll(propertyExp)) {
    properties[match[1]!] = match[2]!;
  }
  return properties;
}

/**
 * Sanitize the ADB device name to only get the actual device name.
 * On Windows, we need to do \r, \n, and \r\n filtering to get the name.
 */
export function sanitizeAdbDeviceName(deviceName: string) {
  return deviceName
    .trim()
    .split(/[\r\n]+/)
    .shift();
}
