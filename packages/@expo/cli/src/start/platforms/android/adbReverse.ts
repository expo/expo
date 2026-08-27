import * as Log from '../../../log';
import { installExitHooks } from '../../../utils/exit';
import { event } from '../events';
import { assertSdkRoot } from './AndroidSdk';
import type { Device } from './adb';
import { adbArgs, getAttachedDevicesAsync, getServer, logUnauthorized } from './adb';

let removeExitHook: (() => void) | null = null;
const ADB_REVERSE_WAIT_LIMIT_MS = 2_000;
const ADB_REVERSE_CLEANUP_WAIT_LIMIT_MS = 2_000;

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
  const exitController = new AbortController();
  const operationSignal = signal
    ? AbortSignal.any([signal, exitController.signal])
    : exitController.signal;
  // Install cleanup automatically...
  removeExitHook = installExitHooks(() => {
    exitController.abort();
    stopAdbReverseAsync(ports).catch(() => undefined);
  });

  const devices = await getAttachedDevicesAsync({ signal: operationSignal });
  for (const device of devices) {
    for (const port of ports) {
      if (!(await adbReverseAsync(device, port, operationSignal))) {
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
      signal,
      ADB_REVERSE_WAIT_LIMIT_MS
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
      signal,
      ADB_REVERSE_CLEANUP_WAIT_LIMIT_MS
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
