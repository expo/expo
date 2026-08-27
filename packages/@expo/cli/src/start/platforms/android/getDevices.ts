import { CommandError } from '../../../utils/errors';
import type { Device } from './adb';
import { getAttachedDevicesAsync } from './adb';
import { listAvdsAsync } from './emulator';

/** Get a list of all devices including offline emulators. Asserts if no devices are available. */
export async function getDevicesAsync(): Promise<Device[]> {
  const bootedDevices = await getAttachedDevicesAsync({ shouldShowWaitingMessage: true });

  // NOTE(@kitten): We don't assume AVD must succeed or be present, and still allow
  // devices to be discovered and move on
  let data: Device[];
  try {
    data = await listAvdsAsync();
  } catch (error) {
    if (!bootedDevices.length) {
      throw new CommandError(
        'ANDROID_AVD_DISCOVERY',
        formatNoDevicesMessage(error instanceof Error ? error.message : String(error))
      );
    }
    data = [];
  }

  const allDevices = mergeDevices(bootedDevices, data);

  if (!allDevices.length) {
    throw new CommandError('ANDROID_NO_DEVICES', formatNoDevicesMessage());
  }

  return allDevices;
}

function formatNoDevicesMessage(cause?: string): string {
  return [
    `No Android connected device found, and no emulators could be started automatically.`,
    cause ? `Could not list Android emulators: ${cause}` : null,
    `Connect a device or create an emulator (https://docs.expo.dev/workflow/android-studio-emulator).`,
    `Then follow the instructions here to enable USB debugging:`,
    `https://developer.android.com/studio/run/device.html#developer-device-options. If you are using Genymotion go to Settings -> ADB, select "Use custom Android SDK tools", and point it at your Android SDK directory.`,
  ]
    .filter((line): line is string => line != null)
    .join('\n');
}

export function mergeDevices(attachedDevices: Device[], avds: Device[]): Device[] {
  const connectedNames = new Set(attachedDevices.map(({ name }) => name));
  return attachedDevices.concat(avds.filter(({ name }) => !connectedNames.has(name)));
}
