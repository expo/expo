import chalk from 'chalk';

import type { OSType, Device } from '../../../start/platforms/ios/simctl';
import prompt from '../../../utils/prompts';
import type { ConnectedDevice } from '../appleDevice/AppleDevice';

interface AnyDevice {
  name: string;
  osType: OSType;
  osVersion: string;
  udid: string;
  deviceType?: string;
}

function isConnectedDevice(item: AnyDevice): item is ConnectedDevice {
  return 'deviceType' in item;
}

function isSimControlDevice(item: AnyDevice): item is Device {
  return 'state' in item;
}

/** Format a device for the prompt list. Exposed for testing. */
export function formatDeviceChoice(item: AnyDevice): { title: string; value: string } {
  const isConnected = isConnectedDevice(item) && item.deviceType === 'device';
  const isActive = isSimControlDevice(item) && item.state === 'Booted';
  const symbol =
    item.osType === 'macOS'
      ? '🖥️  '
      : isConnected
        ? item.connectionType === 'Network'
          ? '🌐 '
          : '🔌 '
        : '';
  const format = isActive ? chalk.bold : (text: string) => text;
  return {
    title: `${symbol}${format(item.name)}${
      item.osVersion ? chalk.dim(` (${item.osVersion})`) : ''
    }`,
    value: item.udid,
  };
}

/** Prompt to select a device from a searchable list of devices. */
export async function promptDeviceAsync<T extends AnyDevice>(devices: T[]): Promise<T> {
  // --device with no props after
  const { value } = await prompt({
    type: 'autocomplete',
    name: 'value',
    limit: 11,
    message: 'Select a device',
    choices: devices.map((item) => formatDeviceChoice(item)),
    suggest: (input: any, choices: any) => {
      const regex = new RegExp(input, 'i');
      return choices.filter((choice: any) => regex.test(choice.title));
    },
  });
  return devices.find((device) => device.udid === value)!;
}
