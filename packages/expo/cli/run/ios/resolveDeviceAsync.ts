import chalk from 'chalk';
import { AppleDevice, SimControl, Simulator } from 'xdl';

import * as Log from '../../log';
import { CommandError } from '../../utils/errors';
import { ora } from '../../utils/ora';
import { profile } from '../../utils/profile';
import prompt from '../../utils/prompts';

async function getBuildDestinationsAsync({ osType }: { osType?: string } = {}) {
  const devices = (
    await profile(SimControl.listDevicesAsync, 'SimControl.listDevicesAsync')()
  ).filter((device) => {
    return device.deviceType === 'device';
  });

  const simulators = await Simulator.sortDefaultDeviceToBeginningAsync(
    await profile(SimControl.listSimulatorDevicesAsync)(),
    osType
  );

  return [...devices, ...simulators];
}

export async function resolveDeviceAsync(
  device?: string | boolean,
  { osType }: { osType?: string } = {}
): Promise<SimControl.SimulatorDevice | SimControl.XCTraceDevice> {
  if (!(await profile(Simulator.ensureXcodeCommandLineToolsInstalledAsync)())) {
    throw new CommandError('Unable to verify Xcode and Simulator installation.');
  }

  if (!device) {
    const simulator = await profile(
      Simulator.ensureSimulatorOpenAsync,
      'Simulator.ensureSimulatorOpenAsync'
    )({ osType });
    Log.debug(`Resolved default (${osType}) device:`, simulator.name, simulator.udid);
    return simulator;
  }

  // Only use the spinner with xctrace since it's so slow (~2s), alternative
  // method is very fast (~50ms) and the flicker makes it seem slower.
  const spinner = AppleDevice.isEnabled()
    ? null
    : ora(`🔍 Finding ${device === true ? 'devices' : `device ${chalk.cyan(device)}`}`).start();
  let devices: (SimControl.SimulatorDevice | SimControl.XCTraceDevice)[] = await profile(
    getBuildDestinationsAsync
  )({ osType }).catch(() => []);

  spinner?.stop();

  if (device === true) {
    // If osType is defined, then filter out ineligible simulators.
    // Only do this inside of the device selection so users who pass the entire device udid can attempt to select any simulator (even if it's invalid).
    if (osType) {
      devices = devices.filter((device) => {
        // connected device
        if (!('osType' in device)) {
          return true;
        }
        return device.osType === osType;
      });
    }

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
    Log.log(chalk.dim`\u203A Using --device ${value}`);
    const device = devices.find((device) => device.udid === value)!;
    const isSimulator =
      !('deviceType' in device) ||
      device.deviceType.startsWith('com.apple.CoreSimulator.SimDeviceType.');
    if (isSimulator) {
      return await Simulator.ensureSimulatorOpenAsync({ udid: device.udid });
    }
    return device;
  }
  const searchValue = device.toLowerCase();
  const resolved = devices.find((device) => {
    return device.udid.toLowerCase() === searchValue || device.name.toLowerCase() === searchValue;
  });

  if (!resolved) {
    throw new CommandError(`No device UDID or name matching "${device}"`);
  }

  const isSimulator =
    !('deviceType' in resolved) ||
    resolved.deviceType.startsWith('com.apple.CoreSimulator.SimDeviceType.');
  if (isSimulator) {
    return await Simulator.ensureSimulatorOpenAsync({ udid: resolved.udid });
  }

  return resolved;
}
