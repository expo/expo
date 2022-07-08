import * as osascript from '@expo/osascript';
import { execFileSync } from 'child_process';

import { Device } from './adb';

const debug = require('debug')('expo:start:platforms:android:activateWindow') as typeof console.log;

function getUnixPID(port: number | string): string {
  // Runs like `lsof -i:8081 -P -t -sTCP:LISTEN`
  const args = [`-i:${port}`, '-P', '-t', '-sTCP:LISTEN'];
  debug('lsof ' + args.join(' '));
  return execFileSync('lsof', args, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
  })
    .split('\n')[0]
    ?.trim?.();
}

/** Activate the Emulator window on macOS. */
export async function activateWindowAsync(device: Pick<Device, 'type' | 'pid'>): Promise<boolean> {
  debug(`Activating window for device (pid: ${device.pid}, type: ${device.type})`);
  if (
    // only mac is supported for now.
    process.platform !== 'darwin' ||
    // can only focus emulators
    device.type !== 'emulator'
  ) {
    return false;
  }

  // Google Emulator ID: `emulator-5554` -> `5554`
  const androidPid = device.pid!.match(/-(\d+)/)?.[1];
  if (!androidPid) {
    return false;
  }
  // Unix PID
  const pid = getUnixPID(androidPid);

  if (!pid) {
    return false;
  }
  debug(`Activate window for pid:`, pid);
  try {
    await osascript.execAsync(`
    tell application "System Events"
      set frontmost of the first process whose unix id is ${pid} to true
    end tell`);
    return true;
  } catch {
    // noop -- this feature is very specific and subject to failure.
    return false;
  }
}
