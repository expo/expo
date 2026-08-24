// @ref llp/0005-runtime-loop-tools.rfc.md §Reloading the app
// The fallback: stop the app on the device, so the next deep link starts it from nothing.
//
// This is what the friction run had to do by hand — `xcrun simctl terminate <udid>
// host.exp.Exponent` followed by a deep link [observed — friction run 3, F31] — and it is kept as
// a fallback rather than as the mechanism, because it is slower (about 12 s against under 1 s), it
// needs the platform tools, and it needs to know the application id. The dev server's own reload
// broadcast needs none of that.

import type { NavigatePlatform } from '../navigate/device';
import { spawnCaptureAsync } from '../utils/spawnCapture';

/** Expo Go's application id, per platform, for a project that has no build of its own. */
export const EXPO_GO_APP_ID = {
  ios: 'host.exp.Exponent',
  android: 'host.exp.exponent',
} as const;

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
    return { command: display, ok: false, reason: `could not run "${bin}": ${spawnError.message}` };
  }
  // `simctl terminate` exits non-zero when the app was not running, which is the state this
  // command was trying to reach. Treating it as a failure would abandon a reload that has already
  // done its job.
  if (exitCode !== 0 && !looksLikeNotRunning(`${stderr}\n${stdout}`)) {
    return {
      command: display,
      ok: false,
      reason: stderr.trim() || stdout.trim() || `exit code ${exitCode}`,
    };
  }
  return { command: display, ok: true, reason: null };
}

/** Whether the device tool refused because the app was not running to begin with. */
export function looksLikeNotRunning(output: string): boolean {
  return /found nothing to terminate|not running|No such process|FBSOpenApplicationServiceErrorDomain/i.test(
    output
  );
}
