// @ref llp/0005-runtime-loop-tools.rfc.md
// Minimal device discovery for deep-link navigation: the first booted iOS simulator, or the
// first attached Android device. Both are read from the platform tools as subprocesses, so no
// simulator or emulator library is linked into the CLI.

import { adbNotRunnableError, runAdbAsync, type AdbResolution } from '../device/adb';
import { CommandError } from '../utils/errors';
import { spawnCaptureAsync } from '../utils/spawnCapture';
import { debugEvent } from './events';

export type NavigatePlatform = 'ios' | 'android';

export interface NavigateDevice {
  platform: NavigatePlatform;
  /** Simulator UDID, or `adb` serial. */
  deviceId: string;
  /** Simulator name, when the platform tool reports one. */
  name?: string;
  /**
   * The `adb` this device was found with, so every later call uses the same binary.
   *
   * Android only. Resolving once and carrying it is what stops a run from finding the SDK for the
   * device probe and then spawning a bare `adb` for the deep link (`src/device/adb.ts`).
   */
  adb?: AdbResolution;
  /** The device's hardware model, as `adb devices -l` reports it. Android only. */
  model?: string;
}

export interface DeviceProbe {
  device: NavigateDevice | null;
  /** Why no device was found, for the error message. */
  reason?: string;
  /**
   * The device tool itself could not be run, so nothing was asked about devices.
   *
   * Carried separately from {@link reason} because the two need different headlines: "no device is
   * attached" is a fact about the machine's devices, and this is a fact about the machine's SDK.
   * Reporting the first for the second is friction run 6's F49.
   */
  toolError?: CommandError;
}

/**
 * Read the first booted iOS simulator out of `simctl list devices booted -j`.
 *
 * Only iOS runtimes are considered: a booted watchOS or tvOS simulator cannot open an app deep
 * link for this project.
 */
export function parseBootedIosSimulator(stdout: string): { udid: string; name: string } | null {
  let parsed: { devices?: Record<string, { udid?: string; name?: string }[]> };
  try {
    parsed = JSON.parse(stdout);
  } catch {
    return null;
  }

  for (const [runtime, devices] of Object.entries(parsed.devices ?? {})) {
    if (!runtime.includes('.iOS-') || !Array.isArray(devices)) {
      continue;
    }
    for (const device of devices) {
      if (device?.udid) {
        return { udid: device.udid, name: device.name ?? '' };
      }
    }
  }
  return null;
}

/** One ready device, as `adb devices -l` describes it. */
export interface AndroidDeviceLine {
  deviceId: string;
  /**
   * The `model:` field of the long listing, when there is one.
   *
   * Kept because it is how a debugger target is tied back to this device: React Native Android
   * registers itself as `<Build.MODEL> - <release> - API <sdk>` [observed live — 2026-08-25, a
   * `/json/list` target with `deviceName: "sdk_gphone64_arm64 - 15 - API 35"` for the emulator
   * `adb devices -l` reported as `model:sdk_gphone64_arm64`]. See `src/runtime/targetPlatform.ts`.
   */
  model: string | null;
}

/**
 * Read the ready devices out of `adb devices -l`.
 *
 * The long listing rather than the short one, because the `model:` field is what lets a debugger
 * target be matched back to a device. Everything else about the two formats is the same.
 */
export function parseAndroidDevices(stdout: string): AndroidDeviceLine[] {
  const devices: AndroidDeviceLine[] = [];
  // The first line is the `List of devices attached` header.
  for (const line of stdout.split('\n').slice(1)) {
    const [deviceId, state, ...rest] = line.trim().split(/\s+/);
    // Devices in any other state (`unauthorized`, `offline`) cannot receive an intent.
    if (deviceId && state === 'device') {
      const model = rest.find((field) => field.startsWith('model:'))?.slice('model:'.length);
      devices.push({ deviceId, model: model || null });
    }
  }
  return devices;
}

/** Read the first ready device out of `adb devices`. */
export function parseFirstAndroidDevice(stdout: string): string | null {
  return parseAndroidDevices(stdout)[0]?.deviceId ?? null;
}

/** Look for a booted iOS simulator. Never throws: no simulator is an answer. */
export async function probeIosSimulatorAsync(): Promise<DeviceProbe> {
  const { stdout, stderr, exitCode, spawnError } = await spawnCaptureAsync('xcrun', [
    'simctl',
    'list',
    'devices',
    'booted',
    '-j',
  ]);

  if (spawnError) {
    return {
      device: null,
      reason: `could not run "xcrun simctl": ${spawnError.message}`,
      // The same distinction the Android probe draws (F49): a tool that could not be started has
      // said nothing about this machine's devices, and a caller that turns "no device" into a
      // changed suggestion has to be able to tell the two apart (`src/device/localDevice.ts`).
      toolError: new CommandError(
        'XCRUN_NOT_RUNNABLE',
        [
          `Could not run "xcrun simctl", so no iOS simulator was looked for.`,
          `Why: ${spawnError.message}`,
          `How: install Xcode and its command line tools, which provide "xcrun simctl", then run this command again.`,
        ].join('\n')
      ),
    };
  }
  if (exitCode !== 0) {
    return {
      device: null,
      reason: `"xcrun simctl list devices booted" failed: ${stderr.trim() || `exit code ${exitCode}`}`,
    };
  }

  const simulator = parseBootedIosSimulator(stdout);
  if (!simulator) {
    return { device: null, reason: 'no booted iOS simulator was found' };
  }

  debugEvent('device_resolved', { platform: 'ios', deviceId: simulator.udid });
  return {
    device: { platform: 'ios', deviceId: simulator.udid, name: simulator.name || undefined },
  };
}

/**
 * Look for an attached Android device or emulator. Never throws: no device is an answer.
 *
 * An `adb` that could not be started is **not** folded into that answer. It comes back as
 * {@link DeviceProbe.toolError}, so the caller reports a missing SDK as a missing SDK — the
 * headline "no Android device or emulator is attached" is only reachable once `adb` has run
 * (`src/device/adb.ts`, friction run 6's F49).
 */
export async function probeAndroidDeviceAsync(): Promise<DeviceProbe> {
  const { stdout, stderr, exitCode, spawnError, adb, notRunnable } = await runAdbAsync([
    'devices',
    '-l',
  ]);

  if (notRunnable) {
    return {
      device: null,
      reason: `"adb" could not be run (${spawnError?.message ?? 'no reason given'}), so no device was looked for`,
      toolError: adbNotRunnableError(adb, spawnError?.message ?? 'the process did not start'),
    };
  }
  if (exitCode !== 0) {
    return {
      device: null,
      reason: `"${adb.bin} devices -l" failed: ${stderr.trim() || `exit code ${exitCode}`}`,
    };
  }

  const device = parseAndroidDevices(stdout)[0];
  if (!device) {
    return { device: null, reason: 'no Android device or emulator is attached' };
  }

  debugEvent('device_resolved', { platform: 'android', deviceId: device.deviceId });
  return {
    device: {
      platform: 'android',
      deviceId: device.deviceId,
      adb,
      model: device.model ?? undefined,
    },
  };
}

/**
 * Resolve the device to open the deep link on.
 *
 * With no platform flag, macOS prefers a booted iOS simulator and falls back to Android, because
 * an iOS simulator is the device an Expo project on a Mac usually has open. Every other host has
 * no iOS simulator at all, so only Android is checked there.
 *
 * @throws {CommandError} when the requested platform, or neither platform, has a device.
 */
export async function resolveDeviceAsync(
  platform?: NavigatePlatform,
  context: NoDeviceContext = {}
): Promise<NavigateDevice> {
  if (platform === 'ios') {
    const probe = await probeIosSimulatorAsync();
    if (probe.device) {
      return probe.device;
    }
    if (probe.toolError) {
      throw probe.toolError;
    }
    throw noDeviceError(
      'NO_IOS_DEVICE',
      [
        'No booted iOS simulator was found, so there is no device to open the deep link on.',
        `Why: ${probe.reason}.`,
        'How: boot a simulator (from Xcode, or with "xcrun simctl boot"), start the dev server with "npx exagent dev --detach", then run this command again.',
      ],
      context
    );
  }

  if (platform === 'android') {
    const probe = await probeAndroidDeviceAsync();
    if (probe.device) {
      return probe.device;
    }
    // The tool, not the devices. Raised as its own failure so the reader is not sent to boot an
    // emulator they already have running (F49).
    if (probe.toolError) {
      throw probe.toolError;
    }
    throw noDeviceError(
      'NO_ANDROID_DEVICE',
      [
        'No Android device or emulator was found, so there is no device to open the deep link on.',
        `Why: ${probe.reason}.`,
        'How: start an emulator or connect a device, check that "adb devices" lists it, then run this command again.',
      ],
      context
    );
  }

  const iosProbe = process.platform === 'darwin' ? await probeIosSimulatorAsync() : null;
  if (iosProbe?.device) {
    return iosProbe.device;
  }

  const androidProbe = await probeAndroidDeviceAsync();
  if (androidProbe.device) {
    return androidProbe.device;
  }

  // With no platform flag on a host with no simulator, an unrunnable `adb` is the whole reason
  // nothing was found, and saying "no booted device" would hide it.
  if (androidProbe.toolError && iosProbe == null) {
    throw androidProbe.toolError;
  }

  const reasons = [
    iosProbe ? `iOS: ${iosProbe.reason}` : 'iOS: simulators only exist on macOS',
    `Android: ${androidProbe.reason}`,
  ];
  throw noDeviceError(
    'NO_DEVICE',
    [
      'No booted device was found, so there is no device to open the deep link on.',
      `Why: ${reasons.join('; ')}.`,
      'How: open the app on a simulator or device (for example with "npx expo run:ios" or "npx expo run:android"), then run this command again. Pass --ios or --android to name the platform to look on.',
    ],
    context
  );
}

/** What the caller already worked out, for a failure that can offer more than "no device". */
export interface NoDeviceContext {
  /** The URL that was resolved for the route, when the caller had got that far. */
  url?: string | null;
  /** Whether a dev server answered, so the URL is one something could act on now. */
  devServerRunning?: boolean;
}

/**
 * The failure for a machine with no device, plus the URL when one was resolved.
 *
 * "No device found" is the whole truth and less than half the answer for the case this exists for:
 * a dogfood session drove Expo Go on a **cloud** simulator, from a laptop with no simulator of its
 * own, and every `navigate` it ran stopped here [observed — 2026-08-24]. The URL was resolved a
 * step earlier and thrown away with the error, and the URL is exactly what an external opener
 * needs. So it is named, and so is the flag that prints it without asking for a device at all.
 *
 * Deliberately **not** applied to the tool failures above: an unrunnable `adb` or `xcrun` has a
 * headline about this machine's SDK, and burying it under an alternative is friction run 6's F49.
 */
function noDeviceError(code: string, lines: string[], context: NoDeviceContext): CommandError {
  const withUrl = context.url
    ? [
        ...lines,
        `Or: this is the URL for that route — ${context.url}${
          context.devServerRunning ? '' : ' (no dev server answered, so it may not load yet)'
        }. Open it on a phone, a cloud simulator, or anywhere else that can reach the dev server; "npx exagent navigate <route> --print-url" prints it without looking for a device.`,
      ]
    : lines;
  const error = new CommandError(code, withUrl.join('\n'));
  // A caller that has no device does not get one by running the same command again, so the `Try:`
  // is the mode that answers without one.
  error.suggestedCommand = context.url ? 'npx exagent navigate / --print-url' : undefined;
  return error;
}
