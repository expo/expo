import chalk from 'chalk';

import * as Log from '../../../log';
import {
  AppleDeviceManager,
  ensureSimulatorOpenAsync,
} from '../../../start/platforms/ios/AppleDeviceManager';
import { assertSystemRequirementsAsync } from '../../../start/platforms/ios/assertSystemRequirements';
import { sortDefaultDeviceToBeginningAsync } from '../../../start/platforms/ios/promptAppleDevice';
import { OSType } from '../../../start/platforms/ios/simctl';
import * as SimControl from '../../../start/platforms/ios/simctl';
import { XCTraceDevice } from '../../../start/platforms/ios/xctrace';
import { CommandError } from '../../../utils/errors';
import { ora } from '../../../utils/ora';
import { profile } from '../../../utils/profile';
import prompt from '../../../utils/prompts';
import * as AppleDevice from '../appleDevice/AppleDevice';

async function listDevicesAsync() {
  const results = await AppleDevice.getConnectedDevices();
  // TODO: Add support for osType (ipad, watchos, etc)
  return results.map((device) => ({
    // TODO: Better name
    name: device.DeviceName ?? device.ProductType ?? 'unknown ios device',
    model: device.ProductType,
    osVersion: device.ProductVersion,
    deviceType: 'device',
    udid: device.UniqueDeviceID,
  }));
}

/** Get a list of devices (called destinations) that are connected to the host machine. */
async function getBuildDestinationsAsync({ osType }: { osType?: OSType } = {}) {
  const devices = await profile(listDevicesAsync)();

  const simulators = await sortDefaultDeviceToBeginningAsync(
    await profile(SimControl.getDevicesAsync)(),
    osType
  );

  return [...devices, ...simulators];
}

/** Finds the first possible device and returns in a booted state. */
async function resolveFirstDeviceAsync(osType?: OSType) {
  const manager = await AppleDeviceManager.resolveAsync({
    device: {
      osType: osType,
    },
  });

  Log.debug(
    `Resolved default device (name: ${manager.device.name}, udid: ${manager.device.udid}, osType: ${osType})`
  );
  return manager.device;
}

/** Given a `device` argument from the CLI, parse and prompt our way to a usable device for building. */
export async function resolveDeviceAsync(
  device?: string | boolean,
  { osType }: { osType?: OSType } = {}
): Promise<SimControl.Device | XCTraceDevice> {
  await assertSystemRequirementsAsync();

  if (!device) {
    return resolveFirstDeviceAsync(osType);
  }

  const devices = await getFilteredDevicesAsync(device, { osType });

  const resolved =
    device === true
      ? // `--device` (no props after)
        await promptDeviceAsync(devices)
      : // `--device <name|udid>`
        findDeviceFromSearchValue(devices, device.toLowerCase());

  return ensureBootedAsync(resolved);
}

export function isDeviceASimulator(device: SimControl.Device | XCTraceDevice): boolean {
  return (
    !('deviceType' in device) ||
    device.deviceType.startsWith('com.apple.CoreSimulator.SimDeviceType.')
  );
}

/** Get a list of connected devices, filtered by `osType` if defined. */
async function getFilteredDevicesAsync(
  device?: string | boolean,
  { osType }: { osType?: OSType } = {}
) {
  // TODO: This is very slow, replace with appium or related JS tooling instead.
  // Only use the spinner with xctrace since it's so slow (~2s), alternative
  // method is very fast (~50ms) and the flicker makes it seem slower.
  const spinner = ora(
    `🔍 Finding ${device === true ? 'devices' : `device ${chalk.cyan(device)}`}`
  ).start();
  let devices: (SimControl.Device | XCTraceDevice)[] = await profile(getBuildDestinationsAsync)({
    osType,
  }).catch(() => []);

  spinner?.stop();

  // If osType is defined, then filter out ineligible simulators.
  // Only do this inside of the device selection so users who pass the entire device udid can attempt to select any simulator (even if it's invalid).
  if (osType) {
    devices = filterDevicesForOsType(devices, osType);
  }

  return devices;
}

/** @returns device matching the `searchValue` against name or UDID. */
function findDeviceFromSearchValue(
  devices: (SimControl.Device | XCTraceDevice)[],
  searchValue: string
) {
  const device = devices.find((device) => {
    return device.udid.toLowerCase() === searchValue || device.name.toLowerCase() === searchValue;
  });
  if (!device) {
    throw new CommandError('RUN_IOS_ARGS', `No device UDID or name matching "${searchValue}"`);
  }
  return device;
}

/** Ensures the device is booted if it's a simulator. */
async function ensureBootedAsync(device: SimControl.Device | XCTraceDevice) {
  // --device with no props after
  Log.log(chalk.dim`\u203A Using --device ${device.udid}`);
  if (isDeviceSimulator(device)) {
    return await ensureSimulatorOpenAsync({ udid: device.udid });
  }
  return device;
}

/** @returns `true` if the given device is a simulator. */
function isDeviceSimulator(device: SimControl.Device | XCTraceDevice): boolean {
  return (
    !('deviceType' in device) ||
    device.deviceType.startsWith('com.apple.CoreSimulator.SimDeviceType.')
  );
}

/** Prompt to select a device from a searchable list of devices. */
async function promptDeviceAsync(
  devices: (SimControl.Device | XCTraceDevice)[]
): Promise<SimControl.Device | XCTraceDevice> {
  // --device with no props after
  const { value } = await prompt({
    type: 'autocomplete',
    name: 'value',
    limit: 11,
    message: 'Select a simulator',
    choices: devices.map((item) => {
      const isConnected = 'deviceType' in item && item.deviceType === 'device';
      const isActive = 'state' in item && item.state === 'Booted';
      const symbol = isConnected ? '🔌 ' : '';
      const format = isActive ? chalk.bold : (text: string) => text;
      return {
        title: `${symbol}${format(item.name)}${
          item.osVersion ? chalk.dim(` (${item.osVersion})`) : ''
        }`,
        value: item.udid,
      };
    }),
    suggest: (input: any, choices: any) => {
      const regex = new RegExp(input, 'i');
      return choices.filter((choice: any) => regex.test(choice.title));
    },
  });
  return devices.find((device) => device.udid === value)!;
}

/** @returns a list of devices, filtered by the provided `osType`. */
function filterDevicesForOsType(
  devices: (SimControl.Device | XCTraceDevice)[],
  osType: OSType
): (SimControl.Device | XCTraceDevice)[] {
  return devices.filter((device) => {
    // connected device
    if (!('osType' in device)) {
      return true;
    }
    return device.osType === osType;
  });
}
