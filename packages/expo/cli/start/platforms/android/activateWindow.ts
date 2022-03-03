import * as osascript from '@expo/osascript';
import { execFileSync } from 'child_process';

import * as Log from '../../../log';
import { Device } from './adb';

function getUnixPID(port: number | string): string {
  // Runs like `lsof -i:8081 -P -t -sTCP:LISTEN`
  const args = [`-i:${port}`, '-P', '-t', '-sTCP:LISTEN'];
  Log.debug('lsof ' + args.join(' '));
  return execFileSync('lsof', args, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
  })
    .split('\n')[0]
    ?.trim?.();
}

/** Activate the Emulator window on OSX. */
export async function activateWindowAsync(device: Pick<Device, 'type' | 'pid'>) {
  if (
    // only mac is supported for now.
    process.platform !== 'darwin' ||
    // can only focus emulators
    device.type !== 'emulator'
  ) {
    return;
  }

  // Google Emulator ID: `emulator-5554` -> `5554`
  const androidPid = device.pid!.match(/-(\d+)/)?.[1];
  if (!androidPid) {
    return;
  }
  // Unix PID
  const pid = getUnixPID(androidPid);

  if (!pid) {
    return;
  }
  try {
    await osascript.execAsync(`
    tell application "System Events"
      set frontmost of the first process whose unix id is ${pid} to true
    end tell`);
  } catch {
    // noop -- this feature is very specific and subject to failure.
  }
}
