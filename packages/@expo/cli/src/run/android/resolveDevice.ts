import { AndroidDeviceManager } from '../../start/platforms/android/AndroidDeviceManager';
import { logDeviceArgument } from '../hints';

const debug = require('debug')('expo:android:resolveDevice');

/** Given a `device` argument from the CLI, parse and prompt our way to a usable device for building. */
export async function resolveDeviceAsync(device?: string | boolean) {
  if (!device) {
    const manager = await AndroidDeviceManager.resolveAsync();
    debug(`Resolved default device (name: ${manager.device.name}, pid: ${manager.device.pid})`);
    return manager;
  }

  debug(`Resolving device from argument: ${device}`);
  const manager =
    device === true
      ? // `--device` (no props after)
        await AndroidDeviceManager.resolveAsync({ shouldPrompt: true })
      : // `--device <name>`
        await AndroidDeviceManager.resolveFromNameAsync(device);
  logDeviceArgument(manager.device.name);
  return manager;
}
