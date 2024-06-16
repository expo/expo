import * as osascript from '@expo/osascript';
import spawnAsync from '@expo/spawn-async';

import { Device } from './simctl';
import * as Log from '../../../log';
import { waitForActionAsync } from '../../../utils/delay';
import { CommandError } from '../../../utils/errors';

/** Open the Simulator.app and return when the system registers it as 'open'. */
export async function ensureSimulatorAppRunningAsync(
  device: Partial<Pick<Device, 'udid'>>,
  {
    maxWaitTime,
  }: {
    maxWaitTime?: number;
  } = {}
): Promise<void> {
  if (await isSimulatorAppRunningAsync()) {
    return;
  }

  Log.log(`\u203A Opening the iOS simulator, this might take a moment.`);

  // In theory this would ensure the correct simulator is booted as well.
  // This isn't theory though, this is Xcode.
  await openSimulatorAppAsync(device);

  if (!(await waitForSimulatorAppToStart({ maxWaitTime }))) {
    throw new CommandError(
      'SIMULATOR_TIMEOUT',
      `Simulator app did not open fast enough. Try opening Simulator first, then running your app.`
    );
  }
}

async function waitForSimulatorAppToStart({
  maxWaitTime,
}: { maxWaitTime?: number } = {}): Promise<boolean> {
  return waitForActionAsync<boolean>({
    interval: 50,
    maxWaitTime,
    action: isSimulatorAppRunningAsync,
  });
}

// I think the app can be open while no simulators are booted.
async function isSimulatorAppRunningAsync(): Promise<boolean> {
  try {
    const zeroMeansNo = (
      await osascript.execAsync(
        'tell app "System Events" to count processes whose name is "Simulator"'
      )
    ).trim();
    if (zeroMeansNo === '0') {
      return false;
    }
  } catch (error: any) {
    if (error.message.includes('Application isn’t running')) {
      return false;
    }
    throw error;
  }

  return true;
}

async function openSimulatorAppAsync(device: { udid?: string }) {
  const args = ['-a', 'Simulator'];
  if (device.udid) {
    // This has no effect if the app is already running.
    args.push('--args', '-CurrentDeviceUDID', device.udid);
  }
  await spawnAsync('open', args);
}
