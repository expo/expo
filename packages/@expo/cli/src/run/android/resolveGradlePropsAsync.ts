import path from 'path';

import { Device, getDeviceABIsAsync } from '../../start/platforms/android/adb';
import { CommandError } from '../../utils/errors';

// Supported ABIs for Android. see https://developer.android.com/ndk/guides/abis
const VALID_ARCHITECTURES = ['armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'];

export type GradleProps = {
  /** Directory for the APK based on the `variant`. */
  apkVariantDirectory: string;
  /** Name of the app, used in the `apkVariantDirectory`. */
  appName: string;
  /** Last section of the provided `variant`, indicates the starting directory of the file name for the output APK. E.g. "debug" or "release" */
  buildType: string;
  /** Used to assemble the APK, also included in the output APK filename. */
  flavors?: string[];
  /** Architectures to build for. */
  architectures?: string;
};

function assertVariant(variant?: string) {
  if (variant && typeof variant !== 'string') {
    throw new CommandError('BAD_ARGS', '--variant must be a string');
  }
  return variant ?? 'debug';
}

export async function resolveGradlePropsAsync(
  projectRoot: string,
  options: { variant?: string; allArch?: boolean },
  device: Device
): Promise<GradleProps> {
  const variant = assertVariant(options.variant);
  // NOTE(EvanBacon): Why would this be different? Can we get the different name?
  const appName = 'app';

  const apkDirectory = path.join(projectRoot, 'android', appName, 'build', 'outputs', 'apk');

  // buildDeveloperTrust -> buildtype: trust, flavors: buildDeveloper
  // developmentDebug -> buildType: debug, flavors: development
  // productionRelease -> buildType: release, flavors: production
  // previewDebugOptimized -> buildType: debugOptimized, flavors: preview
  const parts = variant.split(/(?=[A-Z])/);

  // Special case: merge 'Optimized' suffix with preceding part, e.g. into 'debugOptimized'
  let buildType = parts.pop() ?? 'debug';
  if (parts.length > 0 && buildType === 'Optimized') {
    buildType = parts.pop()!.toLowerCase() + buildType;
  } else {
    buildType = buildType.toLowerCase();
  }

  let apkVariantDirectory: string;
  if (parts.length > 0) {
    const flavorPath = parts[0].toLowerCase() + parts.slice(1).join('');
    apkVariantDirectory = path.join(apkDirectory, flavorPath, buildType);
  } else {
    apkVariantDirectory = path.join(apkDirectory, buildType);
  }

  return {
    appName,
    buildType,
    flavors: parts.map((v) => v.toLowerCase()),
    apkVariantDirectory,
    architectures: await getConnectedDeviceABIS(buildType, device, options.allArch),
  };
}

async function getConnectedDeviceABIS(
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

  const validAbis = abis.filter((abi) => VALID_ARCHITECTURES.includes(abi));
  return validAbis.filter((abi, i, arr) => arr.indexOf(abi) === i).join(',');
}
