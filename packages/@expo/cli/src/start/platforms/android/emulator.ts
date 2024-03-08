import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import { spawn } from 'child_process';
import os from 'os';

import { Device, getAttachedDevicesAsync, isBootAnimationCompleteAsync } from './adb';
import * as Log from '../../../log';
import { AbortCommandError } from '../../../utils/errors';
import { installExitHooks } from '../../../utils/exit';

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
  try {
    const { stdout } = await spawnAsync(whichEmulator(), ['-list-avds']);
    return (
      stdout
        .split(os.EOL)
        .filter(Boolean)
        /**
         * AVD IDs cannot contain spaces. This removes extra info lines from the output. e.g.
         * "INFO    | Storing crashdata in: /tmp/android-brent/emu-crash-34.1.18.db
         */
        .filter((name) => !name.trim().includes(' '))
        .map((name) => ({
          name,
          type: 'emulator',
          // unsure from this
          isBooted: false,
          isAuthorized: true,
        }))
    );
  } catch {
    return [];
  }
}

/** Start an Android device and wait until it is booted. */
export async function startDeviceAsync(
  device: Pick<Device, 'name'>,
  {
    timeout = EMULATOR_MAX_WAIT_TIMEOUT,
    interval = 1000,
  }: {
    /** Time in milliseconds to wait before asserting a timeout error. */
    timeout?: number;
    interval?: number;
  } = {}
): Promise<Device> {
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

  return new Promise<Device>((resolve, reject) => {
    const waitTimer = setInterval(async () => {
      try {
        const bootedDevices = await getAttachedDevicesAsync();
        const connected = bootedDevices.find(({ name }) => name === device.name);
        if (connected) {
          const isBooted = await isBootAnimationCompleteAsync(connected.pid);
          if (isBooted) {
            stopWaiting();
            resolve(connected);
          }
        }
      } catch (error) {
        stopWaiting();
        reject(error);
      }
    }, interval);

    // Reject command after timeout
    const maxTimer = setTimeout(() => {
      const manualCommand = `${whichEmulator()} @${device.name}`;
      stopWaitingAndReject(
        `It took too long to start the Android emulator: ${device.name}. You can try starting the emulator manually from the terminal with: ${manualCommand}`
      );
    }, timeout);

    const stopWaiting = () => {
      clearTimeout(maxTimer);
      clearInterval(waitTimer);
      removeExitHook();
    };

    const stopWaitingAndReject = (message: string) => {
      stopWaiting();
      reject(new Error(message));
    };

    const removeExitHook = installExitHooks((signal) => {
      stopWaiting();
      emulatorProcess.kill(signal);
      reject(new AbortCommandError());
    });

    emulatorProcess.on('error', ({ message }) => stopWaitingAndReject(message));

    emulatorProcess.on('exit', () => {
      const manualCommand = `${whichEmulator()} @${device.name}`;
      stopWaitingAndReject(
        `The emulator (${device.name}) quit before it finished opening. You can try starting the emulator manually from the terminal with: ${manualCommand}`
      );
    });
  });
}
