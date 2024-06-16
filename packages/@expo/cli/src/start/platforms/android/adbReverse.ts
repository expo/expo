import { assertSdkRoot } from './AndroidSdk';
import { adbArgs, Device, getAttachedDevicesAsync, getServer, logUnauthorized } from './adb';
import * as Log from '../../../log';
import { installExitHooks } from '../../../utils/exit';

const debug = require('debug')('expo:start:platforms:android:adbReverse') as typeof console.log;

let removeExitHook: (() => void) | null = null;

export function hasAdbReverseAsync(): boolean {
  try {
    return !!assertSdkRoot();
  } catch (error: any) {
    debug('Failed to resolve the Android SDK path, skipping ADB: %s', error.message);
    return false;
  }
}

export async function startAdbReverseAsync(ports: number[]): Promise<boolean> {
  // Install cleanup automatically...
  removeExitHook = installExitHooks(() => {
    stopAdbReverseAsync(ports);
  });

  const devices = await getAttachedDevicesAsync();
  for (const device of devices) {
    for (const port of ports) {
      if (!(await adbReverseAsync(device, port))) {
        debug(`Failed to start reverse port ${port} on device "${device.name}"`);
        return false;
      }
    }
  }
  return true;
}

export async function stopAdbReverseAsync(ports: number[]): Promise<void> {
  removeExitHook?.();

  const devices = await getAttachedDevicesAsync();
  for (const device of devices) {
    for (const port of ports) {
      await adbReverseRemoveAsync(device, port);
    }
  }
}

async function adbReverseAsync(device: Device, port: number): Promise<boolean> {
  if (!device.isAuthorized) {
    logUnauthorized(device);
    return false;
  }

  try {
    await getServer().runAsync(adbArgs(device.pid, 'reverse', `tcp:${port}`, `tcp:${port}`));
    return true;
  } catch (error: any) {
    Log.warn(`[ADB] Couldn't reverse port ${port}: ${error.message}`);
    return false;
  }
}

async function adbReverseRemoveAsync(device: Device, port: number): Promise<boolean> {
  if (!device.isAuthorized) {
    return false;
  }

  try {
    await getServer().runAsync(adbArgs(device.pid, 'reverse', '--remove', `tcp:${port}`));
    return true;
  } catch (error: any) {
    // Don't send this to warn because we call this preemptively sometimes
    debug(`Could not unforward port ${port}: ${error.message}`);
    return false;
  }
}
