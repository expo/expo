import spawnAsync from '@expo/spawn-async';
import os from 'os';

import { CommandError } from '../../../utils/errors';
import * as AndroidDeviceBridge from './AndroidDeviceBridge';
import { whichEmulator } from './emulator';

/** Returns a list of emulator names. */
async function getEmulatorsAsync(): Promise<AndroidDeviceBridge.Device[]> {
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

export async function getDevicesAsync(): Promise<AndroidDeviceBridge.Device[]> {
  const bootedDevices = await AndroidDeviceBridge.getAttachedDevicesAsync();

  const data = await getEmulatorsAsync();
  const connectedNames = bootedDevices.map(({ name }) => name);

  const offlineEmulators = data
    .filter(({ name }) => !connectedNames.includes(name))
    .map(({ name, type }) => {
      return {
        name,
        type,
        isBooted: false,
        // TODO: Are emulators always authorized?
        isAuthorized: true,
      };
    });

  const allDevices = bootedDevices.concat(offlineEmulators);

  if (!allDevices.length) {
    throw new CommandError(
      [
        `No Android connected device found, and no emulators could be started automatically.`,
        `Please connect a device or create an emulator (https://docs.expo.dev/workflow/android-studio-emulator).`,
        `Then follow the instructions here to enable USB debugging:`,
        `https://developer.android.com/studio/run/device.html#developer-device-options. If you are using Genymotion go to Settings -> ADB, select "Use custom Android SDK tools", and point it at your Android SDK directory.`,
      ].join('\n')
    );
  }

  return allDevices;
}
