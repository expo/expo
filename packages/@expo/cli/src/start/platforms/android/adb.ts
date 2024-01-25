import chalk from 'chalk';
import os from 'os';

import { ADBServer } from './ADBServer';
import * as Log from '../../../log';
import { env } from '../../../utils/env';
import { CommandError } from '../../../utils/errors';
import { learnMore } from '../../../utils/link';

const debug = require('debug')('expo:start:platforms:android:adb') as typeof console.log;

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
  androidPackage: string
): Promise<boolean> {
  const packages = await getServer().runAsync(
    adbArgs(
      device.pid,
      'shell',
      'pm',
      'list',
      'packages',
      '--user',
      env.EXPO_ADB_USER,
      androidPackage
    )
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

/**
 * @param device.pid Process ID of the Android device to launch.
 * @param props.launchActivity Activity to launch `[application identifier]/.[main activity name]`, ex: `com.bacon.app/.MainActivity`
 */
export async function launchActivityAsync(
  device: DeviceContext,
  {
    launchActivity,
  }: {
    launchActivity: string;
  }
) {
  return openAsync(
    adbArgs(
      device.pid,
      'shell',
      'am',
      'start',
      // FLAG_ACTIVITY_SINGLE_TOP -- If set, the activity will not be launched if it is already running at the top of the history stack.
      '-f',
      '0x20000000',
      // Activity to open first: com.bacon.app/.MainActivity
      '-n',
      launchActivity
    )
  );
}

/**
 * @param device.pid Process ID of the Android device to launch.
 * @param props.applicationId package name to launch.
 */
export async function openAppIdAsync(
  device: DeviceContext,
  {
    applicationId,
  }: {
    applicationId: string;
  }
) {
  return openAsync(
    adbArgs(
      device.pid,
      'shell',
      'monkey',
      '-p',
      applicationId,
      '-c',
      'android.intent.category.LAUNCHER',
      '1'
    )
  );
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
  }
) {
  return openAsync(
    adbArgs(
      device.pid,
      'shell',
      'am',
      'start',
      '-a',
      'android.intent.action.VIEW',
      '-d',
      // ADB requires ampersands to be escaped.
      url.replace(/&/g, String.raw`\&`)
    )
  );
}

/** Runs a generic command watches for common errors in order to throw with an expected code. */
async function openAsync(args: string[]): Promise<string> {
  const results = await getServer().runAsync(args);
  if (
    results.includes(CANT_START_ACTIVITY_ERROR) ||
    results.match(/Error: Activity class .* does not exist\./g)
  ) {
    throw new CommandError('APP_NOT_INSTALLED', results.substring(results.indexOf('Error: ')));
  }
  return results;
}

/** Uninstall an app given its Android package name. */
export async function uninstallAsync(
  device: DeviceContext,
  { appId }: { appId: string }
): Promise<string> {
  return await getServer().runAsync(
    adbArgs(device.pid, 'uninstall', '--user', env.EXPO_ADB_USER, appId)
  );
}

/** Get package info from an app based on its Android package name. */
export async function getPackageInfoAsync(
  device: DeviceContext,
  { appId }: { appId: string }
): Promise<string> {
  return await getServer().runAsync(adbArgs(device.pid, 'shell', 'dumpsys', 'package', appId));
}

/** Install an app on a connected device. */
export async function installAsync(device: DeviceContext, { filePath }: { filePath: string }) {
  // TODO: Handle the `INSTALL_FAILED_INSUFFICIENT_STORAGE` error.
  return await getServer().runAsync(
    adbArgs(device.pid, 'install', '-r', '-d', '--user', env.EXPO_ADB_USER, filePath)
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

// TODO: This is very expensive for some operations.
export async function getAttachedDevicesAsync(): Promise<Device[]> {
  const output = await getServer().runAsync(['devices', '-l']);

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
      name = (await getAdbNameForDeviceIdAsync({ pid })) ?? '';
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

/**
 * Return the Emulator name for an emulator ID, this can be used to determine if an emulator is booted.
 *
 * @param device.pid a value like `emulator-5554` from `abd devices`
 */
export async function getAdbNameForDeviceIdAsync(device: DeviceContext): Promise<string | null> {
  const results = await getServer().runAsync(adbArgs(device.pid, 'emu', 'avd', 'name'));

  if (results.match(/could not connect to TCP port .*: Connection refused/)) {
    // Can also occur when the emulator does not exist.
    throw new CommandError('EMULATOR_NOT_FOUND', results);
  }

  return sanitizeAdbDeviceName(results) ?? null;
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

/**
 * Returns true when a device's splash screen animation has stopped.
 * This can be used to detect when a device is fully booted and ready to use.
 *
 * @param pid
 */
export async function isBootAnimationCompleteAsync(pid?: string): Promise<boolean> {
  try {
    const props = await getPropertyDataForDeviceAsync({ pid }, PROP_BOOT_ANIMATION_STATE);
    return !!props[PROP_BOOT_ANIMATION_STATE].match(/stopped/);
  } catch {
    return false;
  }
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
  prop?: string
): Promise<DeviceProperties> {
  // @ts-ignore
  const propCommand = adbArgs(...[device.pid, 'shell', 'getprop', prop].filter(Boolean));
  try {
    // Prevent reading as UTF8.
    const results = await getServer().getFileOutputAsync(propCommand);
    // Like:
    // [wifi.direct.interface]: [p2p-dev-wlan0]
    // [wifi.interface]: [wlan0]

    if (prop) {
      debug(`Property data: (device pid: ${device.pid}, prop: ${prop}, data: ${results})`);
      return {
        [prop]: results,
      };
    }
    const props = parseAdbDeviceProperties(results);

    debug(`Parsed data:`, props);

    return props;
  } catch (error: any) {
    // TODO: Ensure error has message and not stderr
    throw new CommandError(`Failed to get properties for device (${device.pid}): ${error.message}`);
  }
}

function parseAdbDeviceProperties(devicePropertiesString: string) {
  const properties: DeviceProperties = {};
  const propertyExp = /\[(.*?)\]: \[(.*?)\]/gm;
  for (const match of devicePropertiesString.matchAll(propertyExp)) {
    properties[match[1]] = match[2];
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
