// @ref llp/0005-runtime-loop-tools.rfc.md §Reloading the app
// @ref llp/0005-runtime-loop-tools.rfc.md §Stopping the app
// Stopping the app on a device.
//
// Two commands need it and for opposite reasons. `runtime:stop` is the whole point of the command:
// end the app process. `runtime:reload` uses it as a *fallback*, when the dev server's reload
// broadcast has nobody to reach — and only as a fallback, because it is slower (about 2.5 s
// against under 1 s live), it needs the platform tools, and it needs to know the application id,
// none of which the broadcast needs.

import { resolveAdb, type AdbResolution } from '../device/adb';
import { buildCloudStopAppArgs, stopAppOnCloudSimulatorAsync } from '../device/cloudSimulator';
import type { DeviceBackend, NavigatePlatform } from '../navigate/device';
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
export interface StopAppParams {
  platform: NavigatePlatform;
  deviceId: string;
  appId: string;
  /** The `adb` to spawn, as `src/device/adb.ts` resolved it. Absent means the bare name. */
  adb?: AdbResolution;
  /**
   * Which device layer this app is on. Defaults to the local one for the platform.
   *
   * `cloud` sends the controller's `close <appId>` through `eas simulator:exec` instead of a
   * platform tool: the device is not on this machine, so `simctl` and `adb` have nothing to aim at
   * (llp/0005 §What the cloud backend can and cannot do).
   */
  backend?: DeviceBackend;
  /** The project whose session is driven. Required for `cloud`, ignored otherwise. */
  projectRoot?: string;
}

export function buildStopAppCommand({
  platform,
  deviceId,
  appId,
  adb,
  backend,
}: StopAppParams): StopAppCommand {
  if (backend === 'cloud') {
    const args = buildCloudStopAppArgs({ appId });
    return { bin: 'eas', args, display: ['eas', ...args].join(' ') };
  }
  const command: StopAppCommand =
    platform === 'ios'
      ? { bin: 'xcrun', args: ['simctl', 'terminate', deviceId, appId], display: '' }
      : {
          bin: adb?.bin ?? 'adb',
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
export async function stopAppOnDeviceAsync(params: StopAppParams): Promise<StopAppResult> {
  if (params.backend === 'cloud') {
    return await stopAppOnCloudAsync(params);
  }
  // Resolved here when the caller has none, for the same reason the screenshot does it (F49).
  const adb = params.adb ?? (params.platform === 'android' ? resolveAdb() : undefined);
  const { bin, args, display } = buildStopAppCommand({ ...params, adb });
  const { stderr, stdout, exitCode, spawnError } = await spawnCaptureAsync(bin, args);

  if (spawnError) {
    return {
      command: display,
      ok: false,
      wasAlreadyStopped: false,
      reason:
        params.platform === 'android'
          ? `could not run "${bin}": ${spawnError.message}. Set ANDROID_HOME to the Android SDK root, or put its platform-tools on PATH.`
          : `could not run "${bin}": ${spawnError.message}`,
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

/**
 * Stop the app through the session's controller.
 *
 * The same answer shape as the local path, and one deliberate difference in how a non-zero exit is
 * read (llp/0005 §A non-zero exit means different things per backend). `simctl terminate` exiting
 * non-zero is the device answering about the app; `simulator:exec` exiting non-zero is any of a
 * session that ended, a signed-out account, or a binary that was never the EAS CLI — so it is a
 * failure with the tool's own words in it, and only the "it was not running" wording is read as the
 * state the caller wanted.
 */
async function stopAppOnCloudAsync(params: StopAppParams): Promise<StopAppResult> {
  const { display } = buildStopAppCommand(params);
  if (params.projectRoot == null) {
    return {
      command: display,
      ok: false,
      wasAlreadyStopped: false,
      reason:
        'a cloud simulator stop was asked for and no project was named to find the session in, which is a bug in this CLI',
    };
  }

  const result = await stopAppOnCloudSimulatorAsync({
    projectRoot: params.projectRoot,
    appId: params.appId,
  });
  if (result.spawnError) {
    return {
      command: display,
      ok: false,
      wasAlreadyStopped: false,
      reason: `could not run "${result.command}": ${result.spawnError}. Install the EAS CLI with "npm install -g eas-cli", or add it to the project with "npm install --save-dev eas-cli".`,
    };
  }
  const notRunning = looksLikeNotRunning(`${result.stderr}\n${result.stdout}`);
  if (result.exitCode !== 0 && !notRunning) {
    return {
      command: display,
      ok: false,
      wasAlreadyStopped: false,
      reason: result.stderr.trim() || result.stdout.trim() || `exit code ${result.exitCode}`,
    };
  }
  return {
    command: display,
    ok: true,
    wasAlreadyStopped: result.exitCode !== 0 && notRunning,
    reason: null,
  };
}

/** Whether the device tool refused because the app was not running to begin with. */
export function looksLikeNotRunning(output: string): boolean {
  return /found nothing to terminate|not running|No such process|FBSOpenApplicationServiceErrorDomain|no (?:such |matching )?app/i.test(
    output
  );
}
