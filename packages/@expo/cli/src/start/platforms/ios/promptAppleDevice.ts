import chalk from 'chalk';

import { getBestSimulatorAsync } from './getBestSimulator';
import { Device } from './simctl';
import { createSelectionFilter, promptAsync } from '../../../utils/prompts';

/**
 * Sort the devices so the last simulator that was opened (user's default) is the first suggested.
 *
 * @param devices list of devices to sort.
 * @param osType optional sort by operating system.
 */
export async function sortDefaultDeviceToBeginningAsync(
  devices: Device[],
  osType?: Device['osType']
): Promise<Device[]> {
  const defaultId = await getBestSimulatorAsync({ osType });
  if (defaultId) {
    let iterations = 0;
    while (devices[0].udid !== defaultId && iterations < devices.length) {
      devices.push(devices.shift()!);
      iterations++;
    }
  }
  return devices;
}

/** Prompt the user to select an Apple device, sorting the most likely option to the beginning. */
export async function promptAppleDeviceAsync(
  devices: Device[],
  osType?: Device['osType']
): Promise<Device> {
  devices = await sortDefaultDeviceToBeginningAsync(devices, osType);
  const results = await promptAppleDeviceInternalAsync(devices);
  return devices.find(({ udid }) => results === udid)!;
}

async function promptAppleDeviceInternalAsync(devices: Device[]): Promise<string> {
  // TODO: provide an option to add or download more simulators
  // TODO: Add support for physical devices too.

  const { value } = await promptAsync({
    type: 'autocomplete',
    name: 'value',
    limit: 11,
    message: 'Select a simulator',
    choices: devices.map((item) => {
      const isActive = item.state === 'Booted';
      const format = isActive ? chalk.bold : (text: string) => text;
      return {
        title: `${format(item.name)} ${chalk.dim(`(${item.osVersion})`)}`,
        value: item.udid,
      };
    }),
    suggest: createSelectionFilter(),
  });

  return value;
}
