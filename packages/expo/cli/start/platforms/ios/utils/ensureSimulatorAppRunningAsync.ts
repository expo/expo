import * as osascript from '@expo/osascript';
import spawnAsync from '@expo/spawn-async';
import { exec } from 'child_process';
import { promisify } from 'util';

import * as Log from '../../../../log';
import { TimeoutError, waitForActionAsync } from './waitForActionAsync';

const execAsync = promisify(exec);

export async function waitForSimulatorAppToStart(): Promise<boolean> {
  return waitForActionAsync<boolean>({
    interval: 50,
    action: isSimulatorAppRunningAsync,
  });
}

/**
 * I think the app can be open while no simulators are booted.
 */
export async function isSimulatorAppRunningAsync(): Promise<boolean> {
  try {
    const zeroMeansNo = (
      await osascript.execAsync(
        'tell app "System Events" to count processes whose name is "Simulator"'
      )
    ).trim();
    if (zeroMeansNo === '0') {
      return false;
    }
  } catch (error) {
    if (error.message.includes('Application isn’t running')) {
      return false;
    }
    throw error;
  }

  return true;
}

export async function ensureSimulatorAppRunningAsync({ udid }: { udid?: string }) {
  // Yes, simulators can be booted even if the app isn't running, obviously we'd never want this.
  if (!(await isSimulatorAppRunningAsync())) {
    Log.log(`\u203A Opening the iOS simulator, this might take a moment.`);

    // In theory this would ensure the correct simulator is booted as well.
    // This isn't theory though, this is Xcode.
    await openSimulatorAppAsync({ udid });
    if (!(await waitForSimulatorAppToStart())) {
      throw new TimeoutError(
        `Simulator app did not open fast enough. Try opening Simulator first, then running your app.`
      );
    }
  }
}

export async function openSimulatorAppAsync({ udid }: { udid?: string }) {
  const args = ['open', '-a', 'Simulator'];
  if (udid) {
    // This has no effect if the app is already running.
    args.push('--args', '-CurrentDeviceUDID', udid);
  }
  await execAsync(args.join(' '));
}

export async function killAllAsync() {
  return await spawnAsync('killAll', ['Simulator']);
}
