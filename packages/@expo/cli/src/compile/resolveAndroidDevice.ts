import spawnAsync from '@expo/spawn-async';
import path from 'path';

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
        ? `--device requires exactly one attached, authorized Android device in the device state. Found ${matches.length}. Select an attached device with --device <serial>.`
        : `Android device "${deviceId}" must match exactly one attached, authorized device in the device state.`
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

export async function assertAndroidArtifactAbisAsync(
  artifactPaths: readonly string[],
  architectures: readonly string[]
): Promise<void> {
  const jar = process.env.JAVA_HOME
    ? path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'jar.exe' : 'jar')
    : 'jar';

  for (const artifactPath of artifactPaths) {
    let stdout: string;
    try {
      ({ stdout } = await spawnAsync(jar, ['--list', '--file', artifactPath], { stdio: 'pipe' }));
    } catch (cause) {
      const error = new CommandError(
        'ANDROID_ARTIFACT',
        `Cannot inspect Android artifact "${artifactPath}" with ${jar}: ${cause instanceof Error ? cause.message : String(cause)}`
      );
      error.cause = cause;
      throw error;
    }

    const artifactArchitectures = new Set<string>();
    for (const entry of stdout.split(/\r?\n/)) {
      const abi = entry.match(/^lib\/([^/]+)\/[^/]+\.so$/)?.[1];
      if (abi) artifactArchitectures.add(abi);
    }
    if (
      artifactArchitectures.size > 0 &&
      !architectures.some((abi) => artifactArchitectures.has(abi))
    ) {
      throw new CommandError(
        'ANDROID_ARTIFACT_ABI',
        `Android artifact "${artifactPath}" contains native libraries for ${[...artifactArchitectures].join(', ')}, but the device supports ${architectures.join(', ')}.`
      );
    }
  }
}
