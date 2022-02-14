import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import child_process from 'child_process';
import os from 'os';

import * as Log from '../../../log';
import * as AndroidDeviceBridge from './AndroidDeviceBridge';

export const EMULATOR_MAX_WAIT_TIMEOUT = 60 * 1000 * 3;

export function whichEmulator(): string {
  if (process.env.ANDROID_HOME) {
    return `${process.env.ANDROID_HOME}/emulator/emulator`;
  }
  return 'emulator';
}

/** Returns a list of emulator names. */
export async function listAvdsAsync(): Promise<AndroidDeviceBridge.Device[]> {
  try {
    const { stdout } = await spawnAsync(whichEmulator(), ['-list-avds']);
    return stdout
      .split(os.EOL)
      .filter(Boolean)
      .map((name) => ({
        name,
        type: 'emulator',
        // unsure from this
        isBooted: false,
        isAuthorized: true,
      }));
  } catch {
    return [];
  }
}

export async function startDeviceAsync(
  device: Pick<AndroidDeviceBridge.Device, 'name'>
): Promise<AndroidDeviceBridge.Device> {
  Log.log(`\u203A Opening emulator ${chalk.bold(device.name)}`);

  // Start a process to open an emulator
  const emulatorProcess = child_process.spawn(
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

  return new Promise<AndroidDeviceBridge.Device>((resolve, reject) => {
    const waitTimer = setInterval(async () => {
      const bootedDevices = await AndroidDeviceBridge.getAttachedDevicesAsync();
      const connected = bootedDevices.find(({ name }) => name === device.name);
      if (connected) {
        const isBooted = await AndroidDeviceBridge.isBootAnimationCompleteAsync(connected.pid);
        if (isBooted) {
          stopWaiting();
          resolve(connected);
        }
      }
    }, 1000);

    // Reject command after timeout
    const maxTimer = setTimeout(() => {
      const manualCommand = `${whichEmulator()} @${device.name}`;
      stopWaitingAndReject(
        `It took too long to start the Android emulator: ${device.name}. You can try starting the emulator manually from the terminal with: ${manualCommand}`
      );
    }, EMULATOR_MAX_WAIT_TIMEOUT);

    const stopWaiting = () => {
      clearTimeout(maxTimer);
      clearInterval(waitTimer);
    };

    const stopWaitingAndReject = (message: string) => {
      stopWaiting();
      reject(new Error(message));
      clearInterval(waitTimer);
    };

    emulatorProcess.on('error', ({ message }) => stopWaitingAndReject(message));

    emulatorProcess.on('exit', () => {
      const manualCommand = `${whichEmulator()} @${device.name}`;
      stopWaitingAndReject(
        `The emulator (${device.name}) quit before it finished opening. You can try starting the emulator manually from the terminal with: ${manualCommand}`
      );
    });
  });
}
