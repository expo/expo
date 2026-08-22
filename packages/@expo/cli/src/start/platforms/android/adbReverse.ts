import * as Log from '../../../log';
import { installExitHooks } from '../../../utils/exit';
import { event } from '../events';
import { assertSdkRoot } from './AndroidSdk';
import type { Device } from './adb';
import { adbArgs, getAttachedDevicesAsync, getServer, logUnauthorized } from './adb';

let removeExitHook: (() => void) | null = null;

export function hasAdbReverseAsync(): boolean {
  try {
    return !!assertSdkRoot();
  } catch (error: any) {
    event('adb_reverse_sdk_missing', { error: event.error(error as Error) });
    return false;
  }
}

export async function startAdbReverseAsync(
  ports: number[],
  signal?: AbortSignal
): Promise<boolean> {
  // Install cleanup automatically...
  removeExitHook = installExitHooks(() => {
    stopAdbReverseAsync(ports);
  });

  const devices = await getAttachedDevicesAsync({ signal });
  for (const device of devices) {
    for (const port of ports) {
      if (!(await adbReverseAsync(device, port, signal))) {
        event('adb_reverse_port_failed', { port, deviceName: device.name });
        return false;
      }
    }
  }
  return true;
}

export async function stopAdbReverseAsync(ports: number[], signal?: AbortSignal): Promise<void> {
  removeExitHook?.();

  const devices = await getAttachedDevicesAsync({ signal });
  for (const device of devices) {
    for (const port of ports) {
      await adbReverseRemoveAsync(device, port, signal);
    }
  }
}

async function adbReverseAsync(
  device: Device,
  port: number,
  signal?: AbortSignal
): Promise<boolean> {
  if (!device.isAuthorized) {
    logUnauthorized(device);
    return false;
  }

  try {
    await getServer().runDeviceMutationAsync(
      adbArgs(device.pid, 'reverse', `tcp:${port}`, `tcp:${port}`),
      'reverse port',
      signal
    );
    return true;
  } catch (error: any) {
    if (signal?.aborted && error === signal.reason) throw error;
    Log.warn(`[ADB] Couldn't reverse port ${port}: ${error.message}`);
    return false;
  }
}

async function adbReverseRemoveAsync(
  device: Device,
  port: number,
  signal?: AbortSignal
): Promise<boolean> {
  if (!device.isAuthorized) {
    return false;
  }

  try {
    await getServer().runDeviceMutationAsync(
      adbArgs(device.pid, 'reverse', '--remove', `tcp:${port}`),
      'remove reverse port',
      signal
    );
    return true;
  } catch (error: any) {
    if (signal?.aborted && error === signal.reason) throw error;
    // Don't send this to warn because we call this preemptively sometimes
    event('adb_reverse_unforward_failed', {
      port,
      error: event.error(error as Error),
    });
    return false;
  }
}
