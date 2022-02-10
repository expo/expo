import chalk from 'chalk';

import { promptAsync } from '../../../utils/prompts';
import { getBestBootedSimulatorAsync, getBestUnbootedSimulatorAsync } from './getBestSimulator';
import { SimulatorDevice } from './SimControl';

/**
 * Get 'best' simulator for the user based on:
 * 1. Currently booted simulator.
 * 2. Last simulator that was opened.
 * 3. First simulator that was opened.
 */
async function getBestSimulatorAsync({ osType }: { osType?: string }): Promise<string> {
  const simulatorOpenedByApp = await getBestBootedSimulatorAsync({ osType });

  if (simulatorOpenedByApp) {
    return simulatorOpenedByApp.udid;
  }

  return await getBestUnbootedSimulatorAsync({ osType });
}

/**
 * Sort the devices so the last simulator that was opened (user's default) is the first suggested.
 *
 * @param devices
 */
async function sortDefaultDeviceToBeginningAsync(
  devices: SimulatorDevice[],
  osType?: string
): Promise<SimulatorDevice[]> {
  const defaultUdid = await getBestSimulatorAsync({ osType });
  if (defaultUdid) {
    let iterations = 0;
    while (devices[0].udid !== defaultUdid && iterations < devices.length) {
      devices.push(devices.shift()!);
      iterations++;
    }
  }
  return devices;
}

export async function promptAppleDeviceAsync(
  devices: SimulatorDevice[],
  osType?: string
): Promise<SimulatorDevice> {
  devices = await sortDefaultDeviceToBeginningAsync(devices, osType);
  const results = await promptForDeviceAsync(devices);
  return devices.find(({ udid }) => results === udid)!;
}

async function promptForDeviceAsync(devices: SimulatorDevice[]): Promise<string> {
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
    suggest: (input: any, choices: any) => {
      const regex = new RegExp(input, 'i');
      return choices.filter((choice: any) => regex.test(choice.title));
    },
  });

  return value;
}
