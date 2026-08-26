// @ref llp/0005-runtime-loop-tools.rfc.md §Reloading the app
// @ref llp/0005-runtime-loop-tools.rfc.md §Stopping the app
// Stopping the app on a device.
//
// Two commands need it and for opposite reasons. `runtime:stop` is the whole point of the command:
// end the app process. `runtime:reload` uses it as a *fallback*, when the dev server's reload
// broadcast has nobody to reach — and only as a fallback, because it is slower (about 2.5 s
// against under 1 s live), it needs the platform tools, and it needs to know the application id,
// none of which the broadcast needs.

import type { NavigatePlatform } from '../navigate/device';
import { spawnCaptureAsync } from '../utils/spawnCapture';

export interface StopAppCommand {
  bin: string;
  args: string[];
  /** The command as one line, for the report. */
  display: string;
}

/**
 * The command that stops an app on a device.
 *
 * iOS: `simctl terminate`, which ends the process without uninstalling it. Android:
 * `am force-stop`, which is the same thing under another name.
 */
export function buildStopAppCommand({
  platform,
  deviceId,
  appId,
}: {
  platform: NavigatePlatform;
  deviceId: string;
  appId: string;
}): StopAppCommand {
  const command: StopAppCommand =
    platform === 'ios'
      ? { bin: 'xcrun', args: ['simctl', 'terminate', deviceId, appId], display: '' }
      : {
          bin: 'adb',
          args: ['-s', deviceId, 'shell', 'am', 'force-stop', appId],
          display: '',
        };
  command.display = [command.bin, ...command.args].join(' ');
  return command;
}

export interface StopAppResult {
  command: string;
  ok: boolean;
  /**
   * The app was not running to begin with, so nothing was stopped.
   *
   * Reported separately from {@link ok} because the two answer different questions. Both commands
   * that call this wanted the app *not running*, and it is not running — but only one of them did
   * that. `runtime:stop` prints the difference, and `runtime:reload` ignores it, because a
   * relaunch that follows works either way.
   */
  wasAlreadyStopped: boolean;
  /** Why the app was not stopped, or null when it was. */
  reason: string | null;
}

/**
 * Stop an app on a device.
 *
 * Never throws. A device tool that is missing, and an app that was not running, are both things
 * the caller has to weigh against what it is trying to do — and "it was not running" is not a
 * failure of a reload whose next step starts it.
 */
export async function stopAppOnDeviceAsync(params: {
  platform: NavigatePlatform;
  deviceId: string;
  appId: string;
}): Promise<StopAppResult> {
  const { bin, args, display } = buildStopAppCommand(params);
  const { stderr, stdout, exitCode, spawnError } = await spawnCaptureAsync(bin, args);

  if (spawnError) {
    return {
      command: display,
      ok: false,
      wasAlreadyStopped: false,
      reason: `could not run "${bin}": ${spawnError.message}`,
    };
  }
  // `simctl terminate` exits non-zero when the app was not running, which is the state this
  // command was trying to reach. Treating it as a failure would abandon a reload that has already
  // done its job, and would make a second `runtime:stop` fail for having nothing left to do.
  const notRunning = looksLikeNotRunning(`${stderr}\n${stdout}`);
  if (exitCode !== 0 && !notRunning) {
    return {
      command: display,
      ok: false,
      wasAlreadyStopped: false,
      reason: stderr.trim() || stdout.trim() || `exit code ${exitCode}`,
    };
  }
  // `adb shell am force-stop` exits 0 whether or not the app was running and prints nothing
  // either way, so on Android this is only ever inferred from the iOS-shaped message above. The
  // honest reading is "not known to have been stopped already", which is what `false` says.
  return { command: display, ok: true, wasAlreadyStopped: exitCode !== 0 && notRunning, reason: null };
}

/** Whether the device tool refused because the app was not running to begin with. */
export function looksLikeNotRunning(output: string): boolean {
  return /found nothing to terminate|not running|No such process|FBSOpenApplicationServiceErrorDomain/i.test(
    output
  );
}
