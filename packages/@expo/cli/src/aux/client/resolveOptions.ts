import { getConfig } from '@expo/config';

import { AndroidDeviceManager } from '../../start/platforms/android/AndroidDeviceManager';
import { AppleDeviceManager } from '../../start/platforms/ios/AppleDeviceManager';
import { CommandError } from '../../utils/errors';

export type Options = {
  version: string;
  platform: 'ios' | 'android';
  device: AppleDeviceManager | AndroidDeviceManager;
};

export async function resolveDeviceAsync(
  platform: 'ios' | 'android',
  deviceHint?: string | boolean
) {
  if (platform === 'ios') {
    const { isSimulatorDevice, resolveDeviceAsync } = await import(
      '../../run/ios/options/resolveDevice'
    );
    const { AppleDeviceManager } = await import('../../start/platforms/ios/AppleDeviceManager');

    const device = await resolveDeviceAsync(deviceHint);
    if (!isSimulatorDevice(device)) {
      throw new CommandError('Cannot install on a physical Apple device');
    }
    return AppleDeviceManager.resolveAsync({ device });
  } else {
    const { resolveDeviceAsync } = await import('../../run/android/resolveDevice');
    return resolveDeviceAsync(deviceHint);
  }
}

export async function resolveOptionsAsync(projectRoot: string, args: any): Promise<Options> {
  const device = args['--device'];
  const platform = args['--platform'];
  if (!platform || !['ios', 'android'].includes(platform)) {
    throw new CommandError('BAD_ARGS', 'You must specify a platform to install Expo Go on');
  }
  let version = args['--sdk-version'];
  // Default to the currently installed version
  if (!version) {
    // This will throw if expo is not installed
    version = getConfig(projectRoot).exp.sdkVersion!;
  } else if (version.match(/^\d+$/)) {
    // Support `45` and convert to a value like `45.0.0`
    version = version + '.0.0';
  }

  return {
    // Parsed options
    platform,
    version,
    // Resolve the device manager for installing Expo Go
    device: await resolveDeviceAsync(platform, device),
  };
}
