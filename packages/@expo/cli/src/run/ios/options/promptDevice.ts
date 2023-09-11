import chalk from 'chalk';

import * as SimControl from '../../../start/platforms/ios/simctl';
import prompt from '../../../utils/prompts';
import { ConnectedDevice } from '../appleDevice/AppleDevice';

type AnyDevice = SimControl.Device | ConnectedDevice;

function isConnectedDevice(item: AnyDevice): item is ConnectedDevice {
  return 'deviceType' in item;
}

function isSimControlDevice(item: AnyDevice): item is SimControl.Device {
  return 'state' in item;
}

/** Format a device for the prompt list. Exposed for testing. */
export function formatDeviceChoice(item: AnyDevice): { title: string; value: string } {
  const isConnected = isConnectedDevice(item) && item.deviceType === 'device';
  const isActive = isSimControlDevice(item) && item.state === 'Booted';
  const symbol = isConnected ? (item.connectionType === 'Network' ? '🌐 ' : '🔌 ') : '';
  const format = isActive ? chalk.bold : (text: string) => text;
  return {
    title: `${symbol}${format(item.name)}${
      item.osVersion ? chalk.dim(` (${item.osVersion})`) : ''
    }`,
    value: item.udid,
  };
}

/** Prompt to select a device from a searchable list of devices. */
export async function promptDeviceAsync(devices: AnyDevice[]): Promise<AnyDevice> {
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
