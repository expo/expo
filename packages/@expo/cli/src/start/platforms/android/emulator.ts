import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { setTimeout as delayAsync } from 'node:timers/promises';

import * as Log from '../../../log';
import { AbortCommandError, CommandError } from '../../../utils/errors';
import { installExitHooks } from '../../../utils/exit';
import type { Device } from './adb';
import { getAttachedDevicesAsync, isBootAnimationCompleteAsync } from './adb';
import { isAdbDeviceDisconnectedError } from './adbDiagnostics';
import { AdbProcessWaitError } from './adbProcess';

export const EMULATOR_MAX_WAIT_TIMEOUT = 60 * 1000 * 3;

export function whichEmulator(): string {
  // https://developer.android.com/studio/command-line/variables
  // TODO: Add ANDROID_SDK_ROOT support as well https://github.com/expo/expo/pull/16516#discussion_r820037917
  if (process.env.ANDROID_HOME) {
    return `${process.env.ANDROID_HOME}/emulator/emulator`;
  }
  return 'emulator';
}

/** Returns a list of emulator names. */
export async function listAvdsAsync(): Promise<Device[]> {
  const { stdout } = await spawnAsync(whichEmulator(), ['-list-avds']);
  return (
    stdout
      .split(/\r?\n/)
      .filter(Boolean)
      /**
       * AVD IDs cannot contain spaces. This removes extra info lines from the output. e.g.
       * "INFO    | Storing crashdata in: /tmp/android-brent/emu-crash-34.1.18.db
       */
      .filter((name) => !name.trim().includes(' '))
      .map((name) => ({
        name,
        type: 'emulator',
        isBooted: false,
        isAuthorized: true,
        isLaunchable: true,
      }))
  );
}

/** Start an Android device and wait until it is booted. */
export async function startDeviceAsync(
  device: Pick<Device, 'name'>,
  {
    timeout = EMULATOR_MAX_WAIT_TIMEOUT,
    interval = 1000,
    signal,
  }: {
    /** Time in milliseconds to wait before asserting a timeout error. */
    timeout?: number;
    interval?: number;
    signal?: AbortSignal;
  } = {}
): Promise<Device> {
  signal?.throwIfAborted();
  Log.log(`\u203A Opening emulator ${chalk.bold(device.name)}`);

  // Start a process to open an emulator
  const emulatorProcess = spawn(
    whichEmulator(),
    [
      `@${device.name}`,
      // disable animation for faster boot -- this might make it harder to detect if it mounted properly tho
      //'-no-boot-anim'
    ],
    {
      stdio: 'ignore',
      detached: true,
    }
  );

  emulatorProcess.unref();

  const controller = new AbortController();
  const timeoutSignal = AbortSignal.timeout(timeout);
  const operationSignal = signal
    ? AbortSignal.any([signal, controller.signal, timeoutSignal])
    : AbortSignal.any([controller.signal, timeoutSignal]);
  const manualCommand = `${whichEmulator()} @${device.name}`;
  const handleEmulatorError = (error: Error) => controller.abort(error);
  const handleEmulatorExit = () =>
    controller.abort(
      new Error(
        `The emulator (${device.name}) quit before it finished opening. You can try starting the emulator manually from the terminal with: ${manualCommand}`
      )
    );
  const removeExitHook = installExitHooks((exitSignal) => {
    emulatorProcess.kill(exitSignal);
    controller.abort(new AbortCommandError());
  });
  emulatorProcess.on('error', handleEmulatorError);
  emulatorProcess.on('exit', handleEmulatorExit);

  try {
    // Wait for each check before delaying so boot polls never overlap.
    while (true) {
      const connected = await checkEmulatorBootAsync(device.name, operationSignal);
      if (connected) return connected;
      await delayAsync(interval, undefined, { signal: operationSignal });
    }
  } catch (error) {
    if (timeoutSignal.aborted && operationSignal.reason === timeoutSignal.reason) {
      throw new Error(
        `It took too long to start the Android emulator: ${device.name}. You can try starting the emulator manually from the terminal with: ${manualCommand}`
      );
    }
    throw operationSignal.aborted ? operationSignal.reason : error;
  } finally {
    removeExitHook();
    emulatorProcess.off('error', handleEmulatorError);
    emulatorProcess.off('exit', handleEmulatorExit);
  }
}

async function checkEmulatorBootAsync(name: string, signal?: AbortSignal): Promise<Device | null> {
  const bootedDevices = await getAttachedDevicesAsync({ signal, shouldShowWaitingMessage: false });
  const connected = bootedDevices.find((device) => device.name === name);
  if (connected) {
    try {
      if (await isBootAnimationCompleteAsync(connected.pid, signal)) {
        return connected;
      }
    } catch (error) {
      if (signal?.aborted) throw signal.reason;
      if (!isTransientBootPropertyError(error)) throw error;
    }
  }
  return null;
}

function isTransientBootPropertyError(error: unknown): boolean {
  const cause =
    error instanceof CommandError && error.code === 'ADB_PROPERTY' ? error.cause : error;
  return cause instanceof AdbProcessWaitError || isAdbDeviceDisconnectedError(cause);
}
