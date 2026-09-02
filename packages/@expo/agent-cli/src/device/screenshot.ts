// @ref llp/0005-runtime-loop-tools.rfc.md §The smoke gate
// Take a picture of what is on the device.
//
// The one thing this CLI could describe and not do. `src/followups/navigate.ts` has printed
// `xcrun simctl io <id> screenshot screen.png` as a suggestion since the first runtime round, and
// nothing ever ran it — so the loop llp/0005 §The smoke gate calls "verified UI changes" ended one
// step short of the verification, every time, with the agent shelling out by hand.
//
// The two platform tools are two lines that never change, and they differ in one way that decides
// the shape of this module: `simctl` is *given* a path and writes the file itself, while `adb
// exec-out screencap -p` writes the PNG to **stdout**, which the caller has to redirect. That is
// why the command descriptor carries an `output` field, and why the capture below cannot use
// `spawnCaptureAsync`: that helper accumulates stdout into a string, and a PNG is not one.
//
// Nothing here is app-scoped. A screenshot is of the *screen*, so it holds whatever the device is
// showing, which is the app when the app is in front and something else when it is not. Said
// plainly rather than implied, because it is the limit a reader will otherwise assume away.

import fs from 'fs';
import path from 'path';

import type { DeviceBackend } from '../navigate/device';
import { resolveSpawnTarget } from '../utils/windowsShim';
import { resolveAdb, type AdbResolution } from './adb';
import { buildCloudScreenshotArgs, captureCloudScreenshotAsync } from './cloudSimulator';

/** Platforms a screenshot can be taken on: the two with a device tool this CLI already spawns. */
export type ScreenshotPlatform = 'ios' | 'android';

/** Where the image bytes come from once the device tool has run. */
export type ScreenshotOutput =
  /** The tool was given the path and wrote the file itself (`simctl`). */
  | 'file'
  /** The tool wrote the PNG to stdout and the caller redirected it (`adb exec-out`). */
  | 'stdout';

export interface ScreenshotCommand {
  bin: string;
  args: string[];
  output: ScreenshotOutput;
  /** The command as a person would type it, including the redirect when there is one. */
  display: string;
}

export interface BuildScreenshotCommandParams {
  platform: ScreenshotPlatform;
  /** Simulator UDID, or `adb` serial. */
  deviceId: string;
  /** Where the PNG is to end up. */
  filePath: string;
  /**
   * The `adb` to spawn, as `./adb.ts` resolved it. Absent means the bare name.
   *
   * A screenshot on a machine with the SDK installed and nothing on `PATH` used to report
   * `"adb" could not be run` and hand back no picture (F49); this is what stops that.
   */
  adb?: AdbResolution;
}

/**
 * Build the device command that captures the screen.
 *
 * Pure, and exported for the test table, for the same reason `buildOpenUrlCommand` is
 * (`src/navigate/deepLink.ts`): the argv is the whole of what this module decides, and a wrong one
 * fails on a machine no test runs on.
 */
export function buildScreenshotCommand({
  platform,
  deviceId,
  filePath,
  adb,
}: BuildScreenshotCommandParams): ScreenshotCommand {
  if (platform === 'ios') {
    const args = ['simctl', 'io', deviceId, 'screenshot', filePath];
    return { bin: 'xcrun', args, output: 'file', display: `xcrun ${args.join(' ')}` };
  }
  // `exec-out` rather than `shell`: `adb shell` runs the command through a pty, which rewrites
  // `\n` as `\r\n` and corrupts every PNG it carries. `exec-out` is the raw stream.
  const bin = adb?.bin ?? 'adb';
  const args = ['-s', deviceId, 'exec-out', 'screencap', '-p'];
  return { bin, args, output: 'stdout', display: `${bin} ${args.join(' ')} > ${filePath}` };
}

export interface ScreenshotResult {
  /** Where the file was to be written. Reported whether or not it was. */
  path: string;
  /** A PNG of the screen is at {@link path}. */
  ok: boolean;
  /** Why there is no screenshot. Null exactly when {@link ok} is true. */
  reason: string | null;
  platform: ScreenshotPlatform | null;
  deviceId: string | null;
  /** The device command, for taking the same picture by hand. Null when none was run. */
  command: string | null;
  /** Size of the file on disk, or null when nothing was written. */
  bytes: number | null;
}

/** The first eight bytes of every PNG file. */
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** How long a device tool gets to answer before it is killed. */
const SCREENSHOT_TIMEOUT_MS = 20_000;

export interface CaptureScreenshotParams extends BuildScreenshotCommandParams {
  /** How long the device tool gets, in milliseconds. */
  timeoutMs?: number;
  /**
   * Which device layer to photograph. Defaults to the local tool for {@link platform}.
   *
   * `cloud` takes the picture through the EAS Simulator session's controller, which **downloads**
   * a PNG to {@link filePath} rather than writing it here. Everything after that is the same: the
   * bytes are checked for the PNG signature, because "the command ran" and "there is a screenshot"
   * are two facts on a network too.
   *
   * @see llp/0005-runtime-loop-tools.rfc.md §Cloud simulator
   */
  backend?: DeviceBackend;
  /** The project whose session is used. Required for `cloud`, ignored otherwise. */
  projectRoot?: string;
}

/**
 * How long the cloud capture gets.
 *
 * Much longer than the local 20 s: the controller is fetched through `npx`, the verb crosses a
 * network, and the image comes back over the same link.
 */
const CLOUD_SCREENSHOT_TIMEOUT_MS = 120_000;

/**
 * Take a screenshot of the device, and say whether one arrived.
 *
 * Never throws: a missing platform tool, a device that refused, and a file that is not a PNG are
 * all things the caller reports next to its other phases rather than failing on. A screenshot is
 * evidence attached to an answer; it is not the answer.
 *
 * The exit code of the tool is **not** what success is read from. `adb exec-out` exits 0 having
 * written an error message to stdout when the device is not ready, which would leave a file that
 * exists, is not empty, and is not a picture — so the bytes are checked for the PNG signature
 * instead. That is the difference between "the command ran" and "there is a screenshot".
 */
export async function captureScreenshotAsync({
  platform,
  deviceId,
  filePath,
  backend,
  projectRoot,
  timeoutMs = backend === 'cloud' ? CLOUD_SCREENSHOT_TIMEOUT_MS : SCREENSHOT_TIMEOUT_MS,
  // Resolved here when the caller has none, so this never spawns a bare `adb` on a machine whose
  // SDK is where the SDK normally is (F49). Never for the cloud backend, which has no `adb`.
  adb = platform === 'android' && backend !== 'cloud' ? resolveAdb() : undefined,
}: CaptureScreenshotParams): Promise<ScreenshotResult> {
  const cloud = backend === 'cloud';
  const command = cloud
    ? cloudScreenshotCommand(filePath)
    : buildScreenshotCommand({ platform, deviceId, filePath, adb });
  const base: ScreenshotResult = {
    path: filePath,
    ok: false,
    reason: null,
    platform,
    deviceId,
    command: command.display,
    bytes: null,
  };

  if (cloud && projectRoot == null) {
    return {
      ...base,
      reason:
        'a cloud simulator screenshot was asked for and no project was named to find the session in, which is a bug in this CLI',
    };
  }

  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  } catch (error: unknown) {
    return {
      ...base,
      reason: `the directory for ${filePath} could not be created (${messageOf(error)})`,
    };
  }
  // A file left over from an earlier run would otherwise be reported as this run's picture.
  try {
    fs.rmSync(filePath, { force: true });
  } catch {
    // A path that cannot be removed is reported below, when nothing new turns up at it.
  }

  const run = cloud
    ? await runCloudScreenshotAsync(projectRoot!, filePath, timeoutMs)
    : await runScreenshotAsync(command, filePath, timeoutMs);
  if (run.spawnError) {
    return {
      ...base,
      reason:
        platform === 'android' && adb
          ? `"${command.bin}" could not be run (${run.spawnError}), so nothing captured the screen — set ANDROID_HOME to the Android SDK root, or put its platform-tools on PATH`
          : `"${command.bin}" could not be run (${run.spawnError}), so nothing captured the screen`,
    };
  }
  if (run.exitCode !== 0) {
    return {
      ...base,
      reason: `"${command.display}" exited ${run.exitCode ?? 'on a signal'}${
        run.stderr.trim() ? `: ${firstLine(run.stderr)}` : ''
      }`,
    };
  }

  let bytes: number;
  try {
    bytes = fs.statSync(filePath).size;
  } catch {
    return { ...base, reason: `${command.bin} reported success and wrote no file at ${filePath}` };
  }
  if (!looksLikePng(filePath)) {
    return {
      ...base,
      bytes,
      reason: `${filePath} is ${bytes} bytes and is not a PNG, so the device tool answered with something other than a picture`,
    };
  }

  return { ...base, ok: true, bytes };
}

/**
 * The cloud capture, as a command descriptor for the report.
 *
 * `output: 'file'` like `simctl`, and for the same reason: the controller is *given* the path and
 * puts the image there itself. Nothing about it is redirected, so the descriptor plumbing below is
 * never reached for it.
 */
function cloudScreenshotCommand(filePath: string): ScreenshotCommand {
  const args = buildCloudScreenshotArgs({ filePath });
  return { bin: 'eas', args, output: 'file', display: `eas ${args.join(' ')}` };
}

/**
 * Run the cloud capture, and answer in the shape the local runner answers in.
 *
 * The failure of the EAS CLI is folded into `stderr` rather than raised: this whole module degrades
 * and never decides (llp/0005 §The smoke gate), and a run that established the app does
 * not throw has established that with or without a picture. A session that ended mid-run is exactly
 * that case.
 */
async function runCloudScreenshotAsync(
  projectRoot: string,
  filePath: string,
  timeoutMs: number
): Promise<{ exitCode: number | null; stderr: string; spawnError?: string }> {
  const result = await captureCloudScreenshotAsync({ projectRoot, filePath, timeoutMs });
  return {
    exitCode: result.exitCode,
    // Both streams, because the EAS CLI reports a dead session on either one and the reason line
    // below is all a reader gets of it.
    stderr: result.stderr.trim() || result.stdout.trim(),
    spawnError: result.spawnError ?? undefined,
  };
}

/** Whether the first bytes of a file are a PNG header. */
function looksLikePng(filePath: string): boolean {
  let fd: number | null = null;
  try {
    fd = fs.openSync(filePath, 'r');
    const head = Buffer.alloc(PNG_SIGNATURE.length);
    const read = fs.readSync(fd, head, 0, head.length, 0);
    return read === PNG_SIGNATURE.length && head.equals(PNG_SIGNATURE);
  } catch {
    return false;
  } finally {
    if (fd != null) {
      try {
        fs.closeSync(fd);
      } catch {
        // Nothing left to do with a descriptor that will not close.
      }
    }
  }
}

/**
 * Run one screenshot command, redirecting stdout into the file when the tool writes it there.
 *
 * The redirect is a file descriptor handed to `spawn`, not a pipe read into a string: the bytes
 * are a PNG, and every string round trip in Node re-encodes them.
 */
function runScreenshotAsync(
  command: ScreenshotCommand,
  filePath: string,
  timeoutMs: number
): Promise<{ exitCode: number | null; stderr: string; spawnError?: string }> {
  // Required lazily so `@expo/agent-cli --help` never pays for the child-process module.
  const { spawn } = require('child_process') as typeof import('child_process');

  return new Promise((resolve) => {
    let fd: number | null = null;
    if (command.output === 'stdout') {
      try {
        fd = fs.openSync(filePath, 'w');
      } catch (error: unknown) {
        resolve({ exitCode: null, stderr: '', spawnError: messageOf(error) });
        return;
      }
    }

    const target = resolveSpawnTarget(command.bin, command.args);
    const child = spawn(target.command, target.args, {
      stdio: ['ignore', fd ?? 'ignore', 'pipe'],
      shell: target.shell,
    });

    const deadline = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
    deadline.unref?.();

    let stderr = '';
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    const done = (result: { exitCode: number | null; stderr: string; spawnError?: string }) => {
      clearTimeout(deadline);
      if (fd != null) {
        try {
          fs.closeSync(fd);
        } catch {
          // The child owned it; a close that fails changes nothing about the file.
        }
        fd = null;
      }
      resolve(result);
    };

    child.on('error', (error: Error) =>
      done({ exitCode: null, stderr, spawnError: error.message })
    );
    child.on('close', (code) => done({ exitCode: code, stderr }));
  });
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function firstLine(text: string): string {
  return text.trim().split('\n')[0]!;
}

/**
 * Where a screenshot goes when the caller names no path.
 *
 * Under `.expo/`, which is already gitignored and already the home of this CLI's per-run files
 * (`src/utils/dotExpo.ts`). Timestamped rather than overwritten, because a sweep of several routes
 * takes several pictures and the second one must not replace the first.
 */
export function defaultScreenshotPath(projectRoot: string, at: Date = new Date()): string {
  const stamp = at.toISOString().replace(/[:.]/g, '-');
  return path.join(projectRoot, '.expo', 'agent-cli', `smoke-${stamp}.png`);
}
