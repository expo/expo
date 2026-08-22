// @ref llp/0005-runtime-loop-tools.rfc.md
// Minimal device discovery for deep-link navigation: the first booted iOS simulator, or the
// first attached Android device. Both are read from the platform tools as subprocesses, so no
// simulator or emulator library is linked into the CLI.

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
}

export interface DeviceProbe {
  device: NavigateDevice | null;
  /** Why no device was found, for the error message. */
  reason?: string;
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

/** Read the first ready device out of `adb devices`. */
export function parseFirstAndroidDevice(stdout: string): string | null {
  // The first line is the `List of devices attached` header.
  for (const line of stdout.split('\n').slice(1)) {
    const [deviceId, state] = line.trim().split(/\s+/);
    // Devices in any other state (`unauthorized`, `offline`) cannot receive an intent.
    if (deviceId && state === 'device') {
      return deviceId;
    }
  }
  return null;
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
    return { device: null, reason: `could not run "xcrun simctl": ${spawnError.message}` };
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

/** Look for an attached Android device or emulator. Never throws: no device is an answer. */
export async function probeAndroidDeviceAsync(): Promise<DeviceProbe> {
  const { stdout, stderr, exitCode, spawnError } = await spawnCaptureAsync('adb', ['devices']);

  if (spawnError) {
    return { device: null, reason: `could not run "adb": ${spawnError.message}` };
  }
  if (exitCode !== 0) {
    return {
      device: null,
      reason: `"adb devices" failed: ${stderr.trim() || `exit code ${exitCode}`}`,
    };
  }

  const deviceId = parseFirstAndroidDevice(stdout);
  if (!deviceId) {
    return { device: null, reason: 'no Android device or emulator is attached' };
  }

  debugEvent('device_resolved', { platform: 'android', deviceId });
  return { device: { platform: 'android', deviceId } };
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
export async function resolveDeviceAsync(platform?: NavigatePlatform): Promise<NavigateDevice> {
  if (platform === 'ios') {
    const probe = await probeIosSimulatorAsync();
    if (probe.device) {
      return probe.device;
    }
    throw new CommandError(
      'NO_IOS_DEVICE',
      [
        'No booted iOS simulator was found, so there is no device to open the deep link on.',
        `Why: ${probe.reason}.`,
        'How: open the app on a simulator with "npx expo run:ios" (or boot one from Xcode and start it with "npx expo start"), then run this command again.',
      ].join('\n')
    );
  }

  if (platform === 'android') {
    const probe = await probeAndroidDeviceAsync();
    if (probe.device) {
      return probe.device;
    }
    throw new CommandError(
      'NO_ANDROID_DEVICE',
      [
        'No Android device or emulator was found, so there is no device to open the deep link on.',
        `Why: ${probe.reason}.`,
        'How: start an emulator or connect a device, check that "adb devices" lists it, then run this command again.',
      ].join('\n')
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

  const reasons = [
    iosProbe ? `iOS: ${iosProbe.reason}` : 'iOS: simulators only exist on macOS',
    `Android: ${androidProbe.reason}`,
  ];
  throw new CommandError(
    'NO_DEVICE',
    [
      'No booted device was found, so there is no device to open the deep link on.',
      `Why: ${reasons.join('; ')}.`,
      'How: open the app on a simulator or device (for example with "npx expo run:ios" or "npx expo run:android"), then run this command again. Pass --ios or --android to name the platform to look on.',
    ].join('\n')
  );
}
