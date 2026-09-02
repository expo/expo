// @ref llp/0005-runtime-loop-tools.rfc.md §Android
// Where `adb` is, and what to say when it is nowhere.
//
// Every Android thing this CLI does — listing devices, opening a deep link, reversing a port,
// force-stopping the app, taking a screenshot — is `adb` in a subprocess, and every one of them
// used to spawn the bare name. On a machine where the Android SDK is installed the normal way and
// `platform-tools` was never put on `PATH`, all five fail with `ENOENT`, and the one that fails
// first is the device probe — so the CLI reported **"no Android device or emulator is attached"**
// for a running emulator [observed — friction run 6 (Android), 2026-08-24, `~/Library/Android/sdk`
// present, `which adb` empty]. That headline sends a reader to boot a device they already have.
//
// Two things fix it, and they are separate:
//
//  1. **Look where the SDK actually is.** `ANDROID_HOME`, then the deprecated `ANDROID_SDK_ROOT`,
//     then `PATH`, then this platform's default install location — the same locations `@expo/cli`
//     resolves [reimplemented from `src/start/platforms/android/AndroidSdk.ts`; not imported, per
//     llp/0001 §Constraints item 5], with one difference. `@expo/cli` puts `PATH` last; here it
//     sits **between** the environment variables and the default location, because all three are
//     different kinds of statement: an `ANDROID_HOME` and an `adb` on `PATH` are both somebody
//     having chosen a copy on purpose, and the default install location is this module guessing.
//     Overruling a deliberate `PATH` entry with a guess would be the wrong way round — and it is
//     what made a test's stub `adb` photograph a real emulator.
//  2. **Never report a device failure for a tool failure.** {@link adbNotRunnableError} is what a
//     caller raises when the spawn itself failed, and it says so — the "no device" message is only
//     reachable once `adb` has run and answered.

import fs from 'fs';
import os from 'os';
import path from 'path';

import { CommandError } from '../utils/errors';
import { spawnCaptureAsync, type SpawnCaptureResult } from '../utils/spawnCapture';

/** Where the `adb` this CLI runs came from. Reported, because it decides what to fix. */
export type AdbSource =
  /** `ANDROID_HOME/platform-tools/adb`. */
  | 'ANDROID_HOME'
  /** `ANDROID_SDK_ROOT/platform-tools/adb`, the deprecated spelling. */
  | 'ANDROID_SDK_ROOT'
  /** The default SDK install location of this platform. */
  | 'default-sdk-location'
  /** Nothing was found on disk, so the bare name is spawned and `PATH` decides. */
  | 'PATH';

export interface AdbResolution {
  /** The command to spawn: an absolute path, or the bare `adb` when only `PATH` can supply one. */
  bin: string;
  source: AdbSource;
  /** Every absolute candidate that was checked and was not there, for the failure message. */
  searched: string[];
  /**
   * True when no copy was found on disk.
   *
   * The one case where a spawn can still fail with `ENOENT`, and the reason this flag is separate
   * from {@link source}: a caller that gets `ENOENT` on a resolved absolute path has a broken SDK,
   * and one that gets it on the bare name has no SDK this module could find.
   */
  fromPathOnly: boolean;
}

/** Path helpers for the platform being searched, not the host running the test. */
function pathFor(platform: string): path.PlatformPath {
  return platform === 'win32' ? path.win32 : path.posix;
}

/** The default Android SDK install locations, per platform. */
function defaultSdkLocations(platform: string, homedir: string): string[] {
  const join = pathFor(platform).join;
  if (platform === 'darwin') {
    return [join(homedir, 'Library', 'Android', 'sdk')];
  }
  // Both capitalisations exist in the wild; Android Studio writes the first one.
  if (platform === 'linux') {
    return [join(homedir, 'Android', 'Sdk'), join(homedir, 'Android', 'sdk')];
  }
  if (platform === 'win32') {
    return [join(homedir, 'AppData', 'Local', 'Android', 'Sdk')];
  }
  return [];
}

export interface ResolveAdbOptions {
  env?: NodeJS.ProcessEnv;
  platform?: string;
  homedir?: string;
  /** Injected so the search order is testable without an Android SDK on the machine. */
  exists?: (candidate: string) => boolean;
}

/**
 * Work out which `adb` to spawn.
 *
 * Never throws and never spawns anything: this is a search of the filesystem, so a caller can
 * report where it looked before any subprocess exists to fail.
 */
export function resolveAdb({
  env = process.env,
  platform = process.platform,
  homedir = os.homedir(),
  exists = fs.existsSync,
}: ResolveAdbOptions = {}): AdbResolution {
  const searched: string[] = [];
  const join = pathFor(platform).join;
  const executables = platform === 'win32' ? ['adb.exe', 'adb.cmd', 'adb'] : ['adb'];

  const fromRoot = (root: string, source: AdbSource): AdbResolution | null => {
    for (const executable of executables) {
      const candidate = join(root, 'platform-tools', executable);
      if (exists(candidate)) {
        return { bin: candidate, source, searched, fromPathOnly: false };
      }
      searched.push(candidate);
    }
    return null;
  };

  const roots: [string, AdbSource][] = [];
  if (env.ANDROID_HOME) {
    roots.push([env.ANDROID_HOME, 'ANDROID_HOME']);
  }
  if (env.ANDROID_SDK_ROOT) {
    roots.push([env.ANDROID_SDK_ROOT, 'ANDROID_SDK_ROOT']);
  }
  for (const [root, source] of roots) {
    const found = fromRoot(root, source);
    if (found) {
      return found;
    }
  }

  // A copy somebody put on `PATH` on purpose, before this module's own guess at where the SDK is.
  const onPath = findOnPath(executables, env.PATH ?? '', platform, exists);
  if (onPath) {
    return { bin: onPath, source: 'PATH', searched, fromPathOnly: false };
  }

  for (const location of defaultSdkLocations(platform, homedir)) {
    const found = fromRoot(location, 'default-sdk-location');
    if (found) {
      return found;
    }
  }

  // Nothing on disk anywhere. The bare name is still spawned rather than refused here: `PATH` can
  // be rewritten by a shim this module cannot see, and letting the spawn fail names the real error.
  return { bin: executables[0]!, source: 'PATH', searched, fromPathOnly: true };
}

/**
 * The first `adb` on `PATH`, resolved to an absolute path.
 *
 * Resolved rather than left as a bare name so the report can say *which* copy ran — two Android
 * SDKs on one machine is common, and "adb" names neither of them.
 */
function findOnPath(
  executables: string[],
  pathValue: string,
  platform: string,
  exists: (candidate: string) => boolean
): string | null {
  const separator = platform === 'win32' ? ';' : ':';
  for (const entry of pathValue.split(separator)) {
    if (!entry) {
      continue;
    }
    for (const executable of executables) {
      const candidate = pathFor(platform).join(entry, executable);
      if (exists(candidate)) {
        return candidate;
      }
    }
  }
  // Not listed in `searched`: `PATH` is often dozens of directories, and naming every one of them
  // in an error message would bury the two that matter.
  return null;
}

/** Everything one `adb` run amounts to, with where the binary came from kept alongside. */
export interface AdbRunResult extends SpawnCaptureResult {
  adb: AdbResolution;
  /**
   * `adb` itself could not be started, so nothing was asked of any device.
   *
   * The distinction the whole module exists for: a caller must never report "no device" for this.
   */
  notRunnable: boolean;
}

/**
 * Run one `adb` command with the binary this machine actually has.
 *
 * Never rejects, like {@link spawnCaptureAsync}: a missing tool and a refusing device are both
 * results, and they are told apart by {@link AdbRunResult.notRunnable}.
 */
export async function runAdbAsync(
  args: string[],
  options: { cwd?: string; timeoutMs?: number; adb?: AdbResolution } = {}
): Promise<AdbRunResult> {
  const adb = options.adb ?? resolveAdb();
  const result = await spawnCaptureAsync(adb.bin, args, {
    cwd: options.cwd,
    timeoutMs: options.timeoutMs,
  });
  return { ...result, adb, notRunnable: result.spawnError != null };
}

/**
 * The failure for an `adb` that could not be started.
 *
 * Its own error, and the reason is in this module's header: the message a reader used to get was
 * about their devices, and nothing had looked for one. What helps instead is the list of places
 * that were checked and the variable that adds another.
 *
 * @param reason what the spawn failed with, quoted so a permission error is not read as a missing
 * file.
 */
export function adbNotRunnableError(adb: AdbResolution, reason: string): CommandError {
  const where = adb.fromPathOnly
    ? `nothing was found at any of the places an Android SDK is normally installed, so the bare name "adb" was spawned and PATH had none either`
    : `the copy at ${adb.bin} (found through ${adb.source}) could not be started`;
  const looked = [...adb.searched, ...(adb.fromPathOnly ? [] : [adb.bin])];

  return new CommandError(
    'ADB_NOT_RUNNABLE',
    [
      `"adb" could not be run, so nothing was asked of any Android device.`,
      `Why: ${where} (${reason}). This says nothing about whether a device or emulator is attached — no command reached one.`,
      `How: install the Android SDK platform tools, then either put them on PATH or set ANDROID_HOME to the SDK root (for example ANDROID_HOME=~/Library/Android/sdk). Looked at: ${looked.join(', ')}.`,
    ].join('\n')
  );
}
