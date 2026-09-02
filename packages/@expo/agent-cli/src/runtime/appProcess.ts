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
import {
  buildCloudStopAppArgs,
  readControllerError,
  stopAppOnCloudSimulatorAsync,
} from '../device/cloudSimulator';
import { quoteForDeviceShell } from '../navigate/deepLink';
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
   * (llp/0005 §Cloud simulator).
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
          // Quoted for the shell `adb shell` starts on the device, the way an `am start` URL is.
          args: ['-s', deviceId, 'shell', 'am', 'force-stop', quoteForDeviceShell(appId)],
          display: '',
        };
  command.display = [command.bin, ...command.args].join(' ');
  return command;
}

export interface StopAppResult {
  command: string;
  ok: boolean;
  /**
   * Whether the tool's answer is about **this application id**.
   *
   * True on iOS, where `simctl terminate` names a process and its exit code is about that process.
   * False for a cloud session, where `agent-device close` answers about the controller's session
   * whatever id it is given [observed — live, 2026-08-26].
   *
   * On Android it depends on a second round trip, and that is F102. `am force-stop` exits 0 and
   * prints nothing whether the app was running or not, so its exit code establishes nothing about
   * the id — yet this used to be `true` there, which made `runtime:stop --android` report
   * `wasRunning: true` on every run, including one whose application id was not installed on the
   * device at all. So Android asks `pidof` **before** the stop: an answer makes this `true` and is
   * what {@link wasAlreadyStopped} is read from, and a `pidof` that could not run makes it `false`.
   *
   * It exists so `wasRunning` can be *absent* rather than wrong: a run that cannot know must not
   * report `wasRunning: true`, which would tell a caller its app had been stopped when the verb
   * established nothing of the kind.
   */
  verified: boolean;
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
  // Asked before the stop, because after it the answer is the same either way (F102).
  const running =
    params.platform === 'android'
      ? await probeAndroidProcessAsync(adb?.bin ?? 'adb', params.deviceId, params.appId)
      : null;
  const { bin, args, display } = buildStopAppCommand({ ...params, adb });
  const { stderr, stdout, exitCode, spawnError } = await spawnCaptureAsync(bin, args);

  if (spawnError) {
    return {
      command: display,
      ok: false,
      verified: true,
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
      verified: true,
      wasAlreadyStopped: false,
      reason: stderr.trim() || stdout.trim() || `exit code ${exitCode}`,
    };
  }
  // `adb shell am force-stop` exits 0 whether or not the app was running and prints nothing either
  // way, so on Android the answer comes from the `pidof` above and from nowhere else (F102). iOS
  // reads it off the tool's own refusal, which does name the process.
  if (params.platform === 'android') {
    return {
      command: display,
      ok: true,
      verified: running !== null,
      wasAlreadyStopped: running === false,
      reason: null,
    };
  }
  return {
    command: display,
    ok: true,
    verified: true,
    wasAlreadyStopped: exitCode !== 0 && notRunning,
    reason: null,
  };
}

/**
 * Whether a package has a process on an Android device, or null when nothing could be established.
 *
 * @ref llp/0005-runtime-loop-tools.rfc.md §Stopping the app — F102.
 * `pidof <package>` answers a pid on stdout for a running app and exits 1 with nothing for one that
 * is not running *or* not installed. Those two are one answer here — nothing was stopped — and both
 * are answers, which is what `am force-stop`'s exit code never was.
 *
 * Null is the third case and it is the one worth being careful about: a shell without `pidof`, an
 * `adb` that could not be spawned, a device that went away between the probe and the stop. Each of
 * those establishes nothing, and a stop whose report says nothing about `wasRunning` is honest where
 * one that guesses `true` is not.
 */
async function probeAndroidProcessAsync(
  bin: string,
  deviceId: string,
  appId: string
): Promise<boolean | null> {
  const { stdout, stderr, exitCode, spawnError } = await spawnCaptureAsync(bin, [
    '-s',
    deviceId,
    'shell',
    'pidof',
    quoteForDeviceShell(appId),
  ]);
  if (spawnError) {
    return null;
  }
  const pid = stdout.trim();
  if (/^\d[\d\s]*$/.test(pid)) {
    return true;
  }
  // Exit 1 with nothing said is `pidof`'s "no such process". Anything else — a shell that has no
  // `pidof`, an `adb` that could not reach the device — is a tool failure wearing the same code.
  const complained = `${stderr}${stdout}`.trim().length > 0;
  return exitCode === 1 && !complained ? false : null;
}

/**
 * Stop the app through the session's controller.
 *
 * Two deliberate differences from the local path, and the second one is a live finding.
 *
 * **A non-zero exit means something else** (llp/0005 §Cloud simulator). `simctl terminate` exiting non-zero is the device answering about the app;
 * `simulator:exec` exiting non-zero is any of a session that ended, a signed-out account, or a
 * binary that was never the EAS CLI.
 *
 * **A zero exit does not mean the named app was stopped.** `close com.nonexistent.zzz.qqq` on a
 * blank simulator exits 0 with `{"success":true,"data":{"session":"default","message":"Closed:
 * default"}}` — the same answer as closing an app that really is there [observed — live session
 * `01a03d80`, 2026-08-26]. So the verb's success is evidence that the controller closed its
 * session's app and no evidence about the id, and {@link StopAppResult.verified} is `false` for
 * this backend so that no caller can report otherwise. `simctl terminate` and `am force-stop` name
 * a process and fail when there is none, which is what makes `wasRunning` knowable there and not
 * here (llp/0005 §Cloud simulator).
 */
async function stopAppOnCloudAsync(params: StopAppParams): Promise<StopAppResult> {
  const { display } = buildStopAppCommand(params);
  if (params.projectRoot == null) {
    return {
      command: display,
      ok: false,
      verified: false,
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
      verified: false,
      wasAlreadyStopped: false,
      // Not an install line for a *missing* CLI: the resolver's third rung downloads the published
      // one, so what failed here is a file that exists and would not start (`src/utils/easCli.ts`).
      reason: `could not run "${result.command}": ${result.spawnError}. Add the EAS CLI to the project with "npm install --save-dev eas-cli" — the project's own copy is resolved first, so it takes precedence over whatever could not be spawned.`,
    };
  }
  if (result.exitCode !== 0) {
    // The controller's own wording, when it gave one, so the reason is what the device said rather
    // than a guess about the argv.
    const controller = readControllerError(`${result.stderr}\n${result.stdout}`);
    return {
      command: display,
      ok: false,
      verified: false,
      wasAlreadyStopped: false,
      reason: controller
        ? `the session's controller answered ${controller.code}: ${controller.message}`
        : result.stderr.trim() || result.stdout.trim() || `exit code ${result.exitCode}`,
    };
  }
  // `wasAlreadyStopped: false` and `verified: false` together say the honest thing: the verb ran,
  // and whether this id was running beforehand was never established.
  return { command: display, ok: true, verified: false, wasAlreadyStopped: false, reason: null };
}

/** Whether the device tool refused because the app was not running to begin with. */
export function looksLikeNotRunning(output: string): boolean {
  return /found nothing to terminate|not running|No such process|FBSOpenApplicationServiceErrorDomain/i.test(
    output
  );
}
