import type { Device } from '../../start/platforms/android/adb';
import { getDeviceABIsAsync } from '../../start/platforms/android/adb';
import { CommandError } from '../../utils/errors';

// Supported ABIs for Android. see https://developer.android.com/ndk/guides/abis
const VALID_ARCHITECTURES = ['armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'];

export type GradleProps = {
  appName: string;
  architectures?: string;
};

function assertVariant(variant?: string) {
  if (variant && typeof variant !== 'string') {
    throw new CommandError('BAD_ARGS', '--variant must be a string');
  }
  return variant ?? 'debug';
}

export async function resolveGradlePropsAsync(
  options: { variant?: string; allArch?: boolean },
  device: Device
): Promise<GradleProps> {
  const variant = assertVariant(options.variant);
  const parts = variant.split(/(?=[A-Z])/);

  // Special case: merge 'Optimized' suffix with preceding part, e.g. into 'debugOptimized'
  let buildType = parts.pop() ?? 'debug';
  if (parts.length > 0 && buildType === 'Optimized') {
    buildType = parts.pop()!.toLowerCase() + buildType;
  } else {
    buildType = buildType.toLowerCase();
  }

  return {
    appName: 'app',
    architectures: await getConnectedDeviceABI(buildType, device, options.allArch),
  };
}

async function getConnectedDeviceABI(
  buildType: string,
  device: Device,
  allArch?: boolean
): Promise<string> {
  // Follow the same behavior as iOS, only enable this for debug builds
  // Support both 'debug' and 'debugOptimized' build types
  const isDebugBuild = buildType === 'debug' || buildType === 'debugOptimized';
  if (allArch || !isDebugBuild) {
    return '';
  }

  const abis = await getDeviceABIsAsync(device);

  return abis.find((abi) => VALID_ARCHITECTURES.includes(abi)) ?? '';
}
