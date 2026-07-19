import { AndroidDeviceManager } from '../../start/platforms/android/AndroidDeviceManager';
import { logDeviceArgument } from '../hints';
import { debugEvent } from '../events';

/** Given a `device` argument from the CLI, parse and prompt our way to a usable device for building. */
export async function resolveDeviceAsync(device?: string | boolean) {
  if (!device) {
    const manager = await AndroidDeviceManager.resolveAsync();
    debugEvent('android:resolved_device', {
      name: manager.device.name,
      pid: manager.device.pid ?? manager.device.name,
    });
    return manager;
  }

  const manager =
    device === true
      ? // `--device` (no props after)
        await AndroidDeviceManager.resolveAsync({ shouldPrompt: true })
      : // `--device <name>`
        await AndroidDeviceManager.resolveFromNameAsync(device);
  logDeviceArgument(manager.device.name);
  return manager;
}
