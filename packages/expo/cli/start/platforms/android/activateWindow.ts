import * as osascript from '@expo/osascript';
import { execFileSync } from 'child_process';

import * as AndroidDeviceBridge from './adb';

function getUnixPID(port: number | string) {
  return execFileSync('lsof', [`-i:${port}`, '-P', '-t', '-sTCP:LISTEN'], {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
  })
    .split('\n')[0]
    .trim();
}

/** Activate the Emulator window on OSX. */
export async function activateWindowAsync(
  device: Pick<AndroidDeviceBridge.Device, 'type' | 'pid'>
) {
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

  try {
    await osascript.execAsync(`
    tell application "System Events"
      set frontmost of the first process whose unix id is ${pid} to true
    end tell`);
  } catch {
    // noop -- this feature is very specific and subject to failure.
  }
}
