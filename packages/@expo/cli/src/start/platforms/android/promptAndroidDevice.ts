import chalk from 'chalk';

import { Device, logUnauthorized } from './adb';
import { AbortCommandError } from '../../../utils/errors';
import { createSelectionFilter, promptAsync } from '../../../utils/prompts';

function nameStyleForDevice(device: Device): (name: string) => string {
  const isActive = device.isBooted;
  if (!isActive) {
    // Use no style changes for a disconnected device that is available to be opened.
    return (text: string) => text;
  }
  // A device that is connected and ready to be used should be bolded to match iOS.
  if (device.isAuthorized) {
    return chalk.bold;
  }
  // Devices that are unauthorized and connected cannot be used, but they are connected so gray them out.
  return (text: string) => chalk.bold(chalk.gray(text));
}

export async function promptForDeviceAsync(devices: Device[]): Promise<Device> {
  // TODO: provide an option to add or download more simulators

  const { value } = await promptAsync({
    type: 'autocomplete',
    name: 'value',
    limit: 11,
    message: 'Select a device/emulator',
    choices: devices.map((item) => {
      const format = nameStyleForDevice(item);
      const type = item.isAuthorized ? item.type : 'unauthorized';
      return {
        title: `${format(item.name)} ${chalk.dim(`(${type})`)}`,
        value: item.name,
      };
    }),
    suggest: createSelectionFilter(),
  });

  const device = devices.find(({ name }) => name === value);

  if (device?.isAuthorized === false) {
    logUnauthorized(device);
    throw new AbortCommandError();
  }

  return device!;
}
