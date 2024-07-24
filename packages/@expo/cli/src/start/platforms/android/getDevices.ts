import { Device, getAttachedDevicesAsync } from './adb';
import { listAvdsAsync } from './emulator';
import { CommandError } from '../../../utils/errors';

/** Get a list of all devices including offline emulators. Asserts if no devices are available. */
export async function getDevicesAsync(): Promise<Device[]> {
  const bootedDevices = await getAttachedDevicesAsync();

  const data = await listAvdsAsync();
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
