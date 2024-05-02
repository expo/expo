// import { resolveDestinationsAsync } from './appleDestinations';
import { promptDeviceAsync } from './promptDevice';
import * as Log from '../../../log';
import {
  AppleDeviceManager,
  ensureSimulatorOpenAsync,
} from '../../../start/platforms/ios/AppleDeviceManager';
import { sortDefaultDeviceToBeginningAsync } from '../../../start/platforms/ios/promptAppleDevice';
import { OSType } from '../../../start/platforms/ios/simctl';
import * as SimControl from '../../../start/platforms/ios/simctl';
import { uniqBy } from '../../../utils/array';
import { CommandError } from '../../../utils/errors';
import { profile } from '../../../utils/profile';
import { logDeviceArgument } from '../../hints';
import { BuildProps } from '../XcodeBuild.types';
import * as AppleDevice from '../appleDevice/AppleDevice';

type AnyDevice = {
  name: string;
  osType: OSType;
  osVersion: string;
  udid: string;
  deviceType?: string;
};
// type AnyDevice = SimControl.Device | AppleDevice.ConnectedDevice;

/** Get a list of devices (called destinations) that are connected to the host machine. Filter by `osType` if defined. */
async function getDevicesAsync({
  osType,
  // ...buildProps
}: { osType?: OSType } & Pick<BuildProps, 'xcodeProject' | 'scheme' | 'configuration'>): Promise<
  AnyDevice[]
> {
  const devices = await sortDefaultDeviceToBeginningAsync(
    uniqBy(
      (
        await Promise.all([
          AppleDevice.getConnectedDevicesAsync(),
          await profile(SimControl.getDevicesAsync)(),
          // resolveDestinationsAsync(buildProps),
        ])
      ).flat(),
      (item) => item.udid
    ),
    osType
  );

  // Sort devices to top of front of the list

  const physical: AnyDevice[] = [];

  const simulators = devices.filter((device) => {
    if ('isAvailable' in device) {
      return true;
    } else {
      physical.push(device);
      return false;
    }
  });

  const isPhone = (a: any) => a.osType === 'iOS';
  const sorted = [
    ...physical.sort((a, b) => {
      const aPhone = isPhone(a);
      const bPhone = isPhone(b);
      if (aPhone && !bPhone) return -1;
      if (!aPhone && bPhone) return 1;

      return 0;
    }),
    ...simulators,
  ];

  // If osType is defined, then filter out ineligible simulators.
  // Only do this inside of the device selection so users who pass the entire device udid can attempt to select any simulator (even if it's invalid).
  return osType ? filterDevicesForOsType(sorted, osType) : sorted;
}

/** @returns a list of devices, filtered by the provided `osType`. */
function filterDevicesForOsType<TDevice extends { osType: OSType }>(
  devices: TDevice[],
  osType: OSType
): TDevice[] {
  return devices.filter((device) => {
    if (osType === 'iOS') {
      // Compatible devices for iOS builds
      return ['iOS', 'macOS', 'xrOS'].includes(device.osType);
    }
    return device.osType === osType;
  });
}

/** Given a `device` argument from the CLI, parse and prompt our way to a usable device for building. */
export async function resolveDeviceAsync(
  device: string | boolean | undefined,
  buildProps: { osType?: OSType } & Pick<BuildProps, 'xcodeProject' | 'scheme' | 'configuration'>
): Promise<AnyDevice> {
  await AppleDeviceManager.assertSystemRequirementsAsync();

  if (!device) {
    /** Finds the first possible device and returns in a booted state. */
    const manager = await AppleDeviceManager.resolveAsync({
      device: {
        osType: buildProps.osType,
      },
    });
    Log.debug(
      `Resolved default device (name: ${manager.device.name}, udid: ${manager.device.udid}, osType: ${buildProps.osType})`
    );
    return manager.device;
  }

  const devices = await getDevicesAsync(buildProps);

  const resolved =
    device === true
      ? // `--device` (no props after)
        // @ts-expect-error
        await promptDeviceAsync(devices)
      : // `--device <name|udid>`
        findDeviceFromSearchValue(devices, device.toLowerCase());

  return ensureBootedAsync(resolved);
}

/** @returns `true` if the given device is a simulator. */
export function isSimulatorDevice(device: AnyDevice): boolean {
  return (
    !('deviceType' in device) ||
    !!device.deviceType?.startsWith?.('com.apple.CoreSimulator.SimDeviceType.')
  );
}

/** @returns device matching the `searchValue` against name or UDID. */
function findDeviceFromSearchValue(devices: AnyDevice[], searchValue: string): AnyDevice {
  const device = devices.find(
    (device) =>
      device.udid.toLowerCase() === searchValue || device.name.toLowerCase() === searchValue
  );
  if (!device) {
    throw new CommandError('BAD_ARGS', `No device UDID or name matching "${searchValue}"`);
  }
  return device;
}

/** Ensures the device is booted if it's a simulator. */
async function ensureBootedAsync(device: AnyDevice): Promise<AnyDevice> {
  // --device with no props after
  logDeviceArgument(device.udid);
  if (isSimulatorDevice(device)) {
    return ensureSimulatorOpenAsync({ udid: device.udid });
  }
  return device;
}
