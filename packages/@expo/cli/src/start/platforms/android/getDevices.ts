import { CommandError } from '../../../utils/errors';
import type { Device } from './adb';
import { getAttachedDevicesAsync } from './adb';
import { listAvdsAsync } from './emulator';

/** Get a list of all devices including offline emulators. Asserts if no devices are available. */
export async function getDevicesAsync(): Promise<Device[]> {
  const bootedDevices = await getAttachedDevicesAsync();

  const data = await listAvdsAsync();
  const allDevices = mergeDevices(bootedDevices, data);

  if (!allDevices.length) {
    throw new CommandError(
      [
        `No Android connected device found, and no emulators could be started automatically.`,
        `Connect a device or create an emulator (https://docs.expo.dev/workflow/android-studio-emulator).`,
        `Then follow the instructions here to enable USB debugging:`,
        `https://developer.android.com/studio/run/device.html#developer-device-options. If you are using Genymotion go to Settings -> ADB, select "Use custom Android SDK tools", and point it at your Android SDK directory.`,
      ].join('\n')
    );
  }

  return allDevices;
}

export function mergeDevices(attachedDevices: Device[], avds: Device[]): Device[] {
  const connectedNames = new Set(attachedDevices.map(({ name }) => name));
  return attachedDevices.concat(avds.filter(({ name }) => !connectedNames.has(name)));
}
