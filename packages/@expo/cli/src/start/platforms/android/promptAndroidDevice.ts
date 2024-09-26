import chalk from 'chalk';

import { Device, logUnauthorized } from './adb';
import { AbortCommandError } from '../../../utils/errors';
import { createSelectionFilter, promptAsync } from '../../../utils/prompts';

export async function promptForDeviceAsync(devices: Device[]): Promise<Device> {
  // TODO: provide an option to add or download more simulators

  const { value } = await promptAsync({
    type: 'autocomplete',
    name: 'value',
    limit: 11,
    message: 'Select a device/emulator',
    choices: devices.map((item) => formatDeviceChoice(item)),
    suggest: createSelectionFilter(),
  });

  const device = devices.find(({ name }) => name === value);

  if (device?.isAuthorized === false) {
    logUnauthorized(device);
    throw new AbortCommandError();
  }

  return device!;
}

/**
 * Format the device for prompt list.
 * @internal - Exposed for testing.
 */
export function formatDeviceChoice(device: Device): { title: string; value: string } {
  const symbol = getDeviceChoiceSymbol(device);
  const name = getDeviceChoiceName(device);
  const type = chalk.dim(device.isAuthorized ? device.type : 'unauthorized');

  return {
    value: device.name,
    title: `${symbol}${name} (${type})`,
  };
}

/** Get the styled symbol of the device, based on ADB connection type (usb vs network) */
function getDeviceChoiceSymbol(device: Device) {
  if (device.type === 'device' && device.connectionType === 'Network') {
    return '🌐 ';
  }

  if (device.type === 'device') {
    return '🔌 ';
  }

  return '';
}

/** Get the styled name of the device, based on device state */
function getDeviceChoiceName(device: Device) {
  // Use no style changes for a disconnected device that is available to be opened.
  if (!device.isBooted) {
    return device.name;
  }

  // A device that is connected and ready to be used should be bolded to match iOS.
  if (device.isAuthorized) {
    return chalk.bold(device.name);
  }

  // Devices that are unauthorized and connected cannot be used, but they are connected so gray them out.
  return chalk.bold(chalk.gray(device.name));
}
