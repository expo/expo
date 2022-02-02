import chalk from 'chalk';
import { AbortCommandError } from '../../utils/errors';

import { promptAsync } from '../../utils/prompts';
import * as AndroidDeviceBridge from './AndroidDeviceBridge';

function nameStyleForDevice(device: AndroidDeviceBridge.Device) {
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

export async function promptForDeviceAsync(
  devices: AndroidDeviceBridge.Device[]
): Promise<AndroidDeviceBridge.Device | null> {
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
    suggest: (input: any, choices: any) => {
      const regex = new RegExp(input, 'i');
      return choices.filter((choice: any) => regex.test(choice.title));
    },
  });

  const device = value ? devices.find(({ name }) => name === value)! : null;

  if (device?.isAuthorized === false) {
    AndroidDeviceBridge.logUnauthorized(device);
    throw new AbortCommandError();
  }

  return device;
}
