import { promptDeviceAsync } from './promptDevice';
import * as Log from '../../../log';
import {
  AppleDeviceManager,
  ensureSimulatorOpenAsync,
} from '../../../start/platforms/ios/AppleDeviceManager';
import { sortDefaultDeviceToBeginningAsync } from '../../../start/platforms/ios/promptAppleDevice';
import { OSType } from '../../../start/platforms/ios/simctl';
import * as SimControl from '../../../start/platforms/ios/simctl';
import { CommandError } from '../../../utils/errors';
import { profile } from '../../../utils/profile';
import { logDeviceArgument } from '../../hints';
import * as AppleDevice from '../appleDevice/AppleDevice';

type AnyDevice = SimControl.Device | AppleDevice.ConnectedDevice;

/** Get a list of devices (called destinations) that are connected to the host machine. Filter by `osType` if defined. */
async function getDevicesAsync({ osType }: { osType?: OSType } = {}): Promise<AnyDevice[]> {
  const connectedDevices = await AppleDevice.getConnectedDevicesAsync();

  const simulators = await sortDefaultDeviceToBeginningAsync(
    await profile(SimControl.getDevicesAsync)(),
    osType
  );

  const devices = [...connectedDevices, ...simulators];

  // If osType is defined, then filter out ineligible simulators.
  // Only do this inside of the device selection so users who pass the entire device udid can attempt to select any simulator (even if it's invalid).
  return osType ? filterDevicesForOsType(devices, osType) : devices;
}

/** @returns a list of devices, filtered by the provided `osType`. */
function filterDevicesForOsType(devices: AnyDevice[], osType: OSType): AnyDevice[] {
  return devices.filter((device) => !('osType' in device) || device.osType === osType);
}

/** Given a `device` argument from the CLI, parse and prompt our way to a usable device for building. */
export async function resolveDeviceAsync(
  device?: string | boolean,
  { osType }: { osType?: OSType } = {}
): Promise<AnyDevice> {
  await AppleDeviceManager.assertSystemRequirementsAsync();

  if (!device) {
    /** Finds the first possible device and returns in a booted state. */
    const manager = await AppleDeviceManager.resolveAsync({
      device: {
        osType,
      },
    });
    Log.debug(
      `Resolved default device (name: ${manager.device.name}, udid: ${manager.device.udid}, osType: ${osType})`
    );
    return manager.device;
  }

  const devices: AnyDevice[] = await getDevicesAsync({
    osType,
  });

  const resolved =
    device === true
      ? // `--device` (no props after)
        await promptDeviceAsync(devices)
      : // `--device <name|udid>`
        findDeviceFromSearchValue(devices, device.toLowerCase());

  return ensureBootedAsync(resolved);
}

/** @returns `true` if the given device is a simulator. */
export function isSimulatorDevice(device: AnyDevice): boolean {
  return (
    !('deviceType' in device) ||
    device.deviceType.startsWith('com.apple.CoreSimulator.SimDeviceType.')
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
