import { assertSdkRoot } from './AndroidSdk';
import type { Device } from './adb';
import { adbArgs, getAttachedDevicesAsync, getServer, logUnauthorized } from './adb';
import * as Log from '../../../log';
import { installExitHooks } from '../../../utils/exit';
import { event } from '../events';

let removeExitHook: (() => void) | null = null;

export function hasAdbReverseAsync(): boolean {
  try {
    return !!assertSdkRoot();
  } catch (error: any) {
    event('adb_reverse_sdk_missing', { error: event.error(error as Error) });
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
        event('adb_reverse_port_failed', { port, deviceName: device.name });
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
    event('adb_reverse_unforward_failed', { port, error: event.error(error as Error) });
    return false;
  }
}
