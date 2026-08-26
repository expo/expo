// @ref llp/0005-runtime-loop-tools.rfc.md §Android
// The step an Android deep link to a dev server on this machine cannot do without.
//
// `exp://127.0.0.1:8250/--/` means *the device's own* 127.0.0.1. On an emulator that is the
// emulator, not the Mac, so the link resolves to a port nothing listens on: Expo Go fails to fetch
// the manifest and lands on its error screen. `navigate --android` opened exactly that link,
// reported `exitCode: 0` because `am start` had succeeded, and exited 0 with the app on
// `ErrorActivity` [observed — friction run 6 (Android), 2026-08-24, screenshot
// `and-01-navigate-noreverse.png`].
//
// `adb reverse tcp:<port> tcp:<port>` is what makes the device's loopback port forward to the
// host's, and it is the step `expo start --android` performs before it opens anything [reference —
// `@expo/cli` `src/start/platforms/android/adbReverse.ts`, reimplemented here as a subprocess
// rather than imported, per llp/0001 §Constraints item 5].
//
// Two limits, stated because they decide when this runs at all:
//
//   - **Only for a loopback host.** A dev server on the LAN (`exp://192.168.1.5:8081`) or behind a
//     tunnel is already reachable from the device, and reversing its port would point the device
//     back at itself.
//   - **Never fatal.** A refusal is reported and the link is still opened: the recovery for a
//     device that will not take a reverse is not to skip the navigation, it is to see the failure
//     the navigation then produces.

import type { AdbResolution } from '../device/adb';
import { spawnCaptureAsync } from '../utils/spawnCapture';
import { debugEvent } from './events';

/** The hosts that mean "this device", and therefore need the port reversing. */
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);

/**
 * The port of a URL that points at a dev server on *this* machine, or null.
 *
 * Null covers every case that needs no reverse: another host, no port, and anything that is not a
 * URL — a development build's own scheme carries no dev server in it at all.
 */
export function loopbackPortOfUrl(url: string): number | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!LOOPBACK_HOSTS.has(parsed.hostname)) {
    return null;
  }
  const port = Number(parsed.port);
  return Number.isInteger(port) && port > 0 ? port : null;
}

export interface ReverseCommand {
  bin: string;
  args: string[];
  /** The command as a person would type it, for reproducing the step by hand. */
  display: string;
}

/** The `adb` command that forwards one device port to the same port on this machine. */
export function buildReverseCommand(
  adb: AdbResolution,
  deviceId: string,
  port: number
): ReverseCommand {
  const args = ['-s', deviceId, 'reverse', `tcp:${port}`, `tcp:${port}`];
  return { bin: adb.bin, args, display: [adb.bin, ...args].join(' ') };
}

export interface ReverseResult {
  /** Whether an `adb reverse` was run at all. */
  ran: boolean;
  /** The port that was reversed, or null when none needed to be. */
  port: number | null;
  /** Whether it worked. Null exactly when {@link ran} is false. */
  ok: boolean | null;
  /** The command that ran, for the report. Null when none did. */
  command: string | null;
  /** Why it did not work, or why none was needed. Null when it worked. */
  reason: string | null;
}

/**
 * Forward the device's loopback port to this machine's, when the URL needs it.
 *
 * Never throws: an `adb` that refuses is reported and the caller carries on, because the deep link
 * that follows is what turns "the reverse failed" into a failure a reader can see.
 */
export async function reverseLoopbackPortAsync({
  adb,
  deviceId,
  url,
}: {
  adb: AdbResolution;
  deviceId: string;
  url: string;
}): Promise<ReverseResult> {
  const port = loopbackPortOfUrl(url);
  if (port == null) {
    return {
      ran: false,
      port: null,
      ok: null,
      command: null,
      reason: `${url} does not name a dev server on this machine's loopback address, so the device can reach it as it is`,
    };
  }

  const command = buildReverseCommand(adb, deviceId, port);
  const { stderr, stdout, exitCode, spawnError } = await spawnCaptureAsync(
    command.bin,
    command.args
  );
  debugEvent('adb_reverse', { port, deviceId, exitCode });

  if (spawnError) {
    return {
      ran: true,
      port,
      ok: false,
      command: command.display,
      reason: `"${command.bin}" could not be run: ${spawnError.message}`,
    };
  }
  if (exitCode !== 0) {
    return {
      ran: true,
      port,
      ok: false,
      command: command.display,
      reason: stderr.trim() || stdout.trim() || `exit code ${exitCode}`,
    };
  }
  return { ran: true, port, ok: true, command: command.display, reason: null };
}
