import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import { execFileSync } from 'child_process';
import os from 'os';

import * as Log from '../../../log';
import { CommandError } from '../../../utils/errors';
import { installExitHooks } from '../../../utils/exit';
import { learnMore } from '../../../utils/link';

export type Device = {
  pid?: string;
  name: string;
  type: 'emulator' | 'device';
  isBooted: boolean;
  isAuthorized: boolean;
};

export class ADBServer {
  isRunning: boolean = false;

  /** Returns the command line reference to ADB. */
  getAdbExecutablePath(): string {
    if (process.env.ANDROID_HOME) {
      return `${process.env.ANDROID_HOME}/platform-tools/adb`;
    }
    return 'adb';
  }

  /** Start the ADB server. */
  async startAsync() {
    if (this.isRunning) {
      return;
    }
    // clean up
    installExitHooks(() => {
      if (this.isRunning) {
        this.stopAsync();
      }
    });
    try {
      const adb = this.getAdbExecutablePath();
      const result = await spawnAsync(adb, ['start-server']);
      const lines = result.stderr.trim().split(/\r?\n/);
      const isStarted = lines.includes('* daemon started successfully');
      this.isRunning = isStarted;
      return isStarted;
    } catch (e) {
      let errorMessage = (e.stderr || e.stdout).trim();
      if (errorMessage.startsWith(BEGINNING_OF_ADB_ERROR_MESSAGE)) {
        errorMessage = errorMessage.substring(BEGINNING_OF_ADB_ERROR_MESSAGE.length);
      }
      e.message = errorMessage;
      throw e;
    }
  }

  async stopAsync() {
    try {
      await this.runAsync(['kill-server']);
      return true;
    } catch {
      return false;
    } finally {
      this.isRunning = false;
    }
  }

  async runAsync(args: string[]): Promise<string> {
    // await Binaries.addToPathAsync('adb');
    const adb = this.getAdbExecutablePath();

    await server.startAsync();

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

  async getFileOutputAsync(args: string[]) {
    // await Binaries.addToPathAsync('adb');
    const adb = this.getAdbExecutablePath();

    await this.startAsync();

    try {
      return await execFileSync(adb, args, {
        encoding: 'latin1',
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
}

export const server = new ADBServer();

const BEGINNING_OF_ADB_ERROR_MESSAGE = 'error: ';

export function logUnauthorized(device: Device) {
  Log.warn(
    `\nThis computer is not authorized for developing on ${chalk.bold(device.name)}. ${chalk.dim(
      learnMore('https://expo.fyi/authorize-android-device')
    )}`
  );
}

/** Returns true if the provided package name is installed on the provided Android device. */
export async function isPackageInstalledAsync(
  device: Device,
  androidPackage: string
): Promise<boolean> {
  const packages = await server.runAsync(
    adbArgs(device.pid, 'shell', 'pm', 'list', 'packages', androidPackage)
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
 * @param device Android device to open on
 * @param props.launchActivity Activity to launch `[application identifier]/.[main activity name]`, ex: `com.bacon.app/.MainActivity`
 */
export async function launchActivityAsync(
  device: Pick<Device, 'pid' | 'type'>,
  {
    launchActivity,
  }: {
    launchActivity: string;
  }
) {
  const openProject = await server.runAsync(
    adbArgs(
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

  return openProject;
}

const CANT_START_ACTIVITY_ERROR = 'Activity not started, unable to resolve Intent';

/**
 * @param device Android device to open on
 * @param props.launchActivity Activity to launch `[application identifier]/.[main activity name]`, ex: `com.bacon.app/.MainActivity`
 */
export async function openAppIdAsync(
  device: Pick<Device, 'pid'>,
  {
    applicationId,
  }: {
    applicationId: string;
  }
) {
  const openClient = await server.runAsync(
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
  if (openClient.includes(CANT_START_ACTIVITY_ERROR)) {
    throw new CommandError(openClient.substring(openClient.indexOf('Error: ')));
  }

  return openClient;
}

/**
 * @param device Android device to open on
 */
export async function openUrlAsync(
  device: Pick<Device, 'pid'>,
  {
    url,
  }: {
    url: string;
  }
) {
  const openProject = await server.runAsync(
    adbArgs(device.pid, 'shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', url)
  );
  if (openProject.includes(CANT_START_ACTIVITY_ERROR)) {
    throw new CommandError(
      'APP_NOT_INSTALLED',
      openProject.substring(openProject.indexOf('Error: '))
    );
  }

  return openProject;
}

/** Uninstall an app given its Android package name. */
export async function uninstallAsync(
  device: Pick<Device, 'pid'>,
  { appId }: { appId: string }
): Promise<string> {
  return await server.runAsync(adbArgs(device.pid, 'uninstall', appId));
}

/** Get package info from an app based on its Android package name. */
export async function getPackageInfoAsync(
  device: Pick<Device, 'pid'>,
  { appId }: { appId: string }
): Promise<string> {
  return await server.runAsync(adbArgs(device.pid, 'shell', 'dumpsys', 'package', appId));
}

export async function installAsync(
  device: Pick<Device, 'pid'>,
  { filePath }: { filePath: string }
) {
  return await server.runAsync(adbArgs(device.pid, 'install', '-r', '-d', filePath));
}

function adbArgs(pid: Device['pid'], ...options: string[]): string[] {
  const args = [];
  if (pid) {
    args.push('-s', pid);
  }
  return args.concat(options);
}

// TODO: This is very expensive for some operations.
export async function getAttachedDevicesAsync(): Promise<Device[]> {
  const output = await server.runAsync(['devices', '-l']);

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

/**
 * Return the Emulator name for an emulator ID, this can be used to determine if an emulator is booted.
 *
 * @param emulatorId a value like `emulator-5554` from `abd devices`
 */
async function getAbdNameForEmulatorIdAsync(emulatorId: string): Promise<string | null> {
  return (
    (await server.runAsync(['-s', emulatorId, 'emu', 'avd', 'name']))
      .trim()
      .split(/\r?\n/)
      .shift() ?? null
  );
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

export async function startAdbReverseAsync(ports: number[]): Promise<boolean> {
  // Install cleanup automatically...
  installExitHooks(() => {
    stopAdbReverseAsync(ports);
  });

  const devices = await getAttachedDevicesAsync();
  for (const device of devices) {
    for (const port of ports) {
      if (!(await adbReverseAsync(device, { port }))) {
        Log.debug(`[ADB] Failed to start reverse port '${port}' on device '${device.name}'`);
        return false;
      }
    }
  }
  return true;
}

export async function stopAdbReverseAsync(ports: number[]): Promise<void> {
  const devices = await getAttachedDevicesAsync();
  for (const device of devices) {
    for (const port of ports) {
      await adbReverseRemoveAsync(device, { port });
    }
  }
}

async function adbReverseAsync(
  device: Device,
  {
    port,
  }: {
    port: number;
  }
): Promise<boolean> {
  if (!device.isAuthorized) {
    return false;
  }

  try {
    await server.runAsync(adbArgs(device.pid, 'reverse', `tcp:${port}`, `tcp:${port}`));
    return true;
  } catch (e) {
    Log.warn(`[ADB] Couldn't reverse port '${port}': ${e.message}`);
    return false;
  }
}

async function adbReverseRemoveAsync(
  device: Device,
  {
    port,
  }: {
    port: number;
  }
): Promise<boolean> {
  if (!device.isAuthorized) {
    return false;
  }

  try {
    await server.runAsync(adbArgs(device.pid, 'reverse', '--remove', `tcp:${port}`));
    return true;
  } catch (e) {
    // Don't send this to warn because we call this preemptively sometimes
    Log.debug(`[ADB] Couldn't reverse remove port '${port}': ${e.message}`);
    return false;
  }
}

// Can sometimes be null
// http://developer.android.com/ndk/guides/abis.html
const PROP_BOOT_ANIMATION_STATE = 'init.svc.bootanim';

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

async function getPropertyDataForDeviceAsync(
  device: Pick<Device, 'pid'>,
  prop?: string
): Promise<DeviceProperties> {
  // @ts-ignore
  const propCommand = adbArgs(...[device.pid, 'shell', 'getprop', prop].filter(Boolean));
  try {
    // Prevent reading as UTF8.
    const results = await server.getFileOutputAsync(propCommand);
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

function parseAdbDeviceProperties(devicePropertiesString: string) {
  const properties: DeviceProperties = {};
  const propertyExp = /\[(.*?)\]: \[(.*?)\]/gm;
  for (const match of devicePropertiesString.matchAll(propertyExp)) {
    properties[match[1]] = match[2];
  }
  return properties;
}
