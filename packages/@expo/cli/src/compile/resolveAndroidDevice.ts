import { getAttachedDevicesAsync, getDeviceABIsAsync } from '../start/platforms/android/adb';
import { CommandError } from '../utils/errors';

const supportedArchitectures = new Set(['armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64']);

export async function resolveAndroidDeviceAsync(deviceId: string): Promise<readonly string[]> {
  const devices = await getAttachedDevicesAsync();
  const matches = devices.filter(
    (device) =>
      device.pid &&
      device.isAuthorized &&
      device.state === 'device' &&
      (deviceId === 'generic' || device.pid === deviceId)
  );
  const [device] = matches;
  if (matches.length !== 1 || device === undefined) {
    throw new CommandError(
      'ANDROID_DEVICE',
      deviceId === 'generic'
        ? `--device requires exactly one connected, authorized Android device that is ready for commands. Found ${matches.length}. Select a device with --device <serial>.`
        : `Android device "${deviceId}" must match exactly one connected, authorized device that is ready for commands.`
    );
  }

  const architectures = [
    ...new Set((await getDeviceABIsAsync(device)).filter((abi) => supportedArchitectures.has(abi))),
  ];
  if (architectures.length === 0) {
    throw new CommandError(
      'ANDROID_DEVICE_ABI',
      `Android device "${device.pid}" has no supported ABIs. Expected armeabi-v7a, arm64-v8a, x86, or x86_64.`
    );
  }
  return architectures;
}
