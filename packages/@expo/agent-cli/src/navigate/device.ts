// @ref llp/0005-runtime-loop-tools.rfc.md
// @ref llp/0005-runtime-loop-tools.rfc.md §Cloud simulator
// Device discovery for deep-link navigation. Three backends, and the first two are the first booted
// iOS simulator and the first attached Android device, read from the platform tools as subprocesses
// so no simulator or emulator library is linked into the CLI.
//
// The third is not on this machine at all: an EAS Simulator session, driven through `eas
// simulator:*` (`src/device/cloudSimulator.ts`). It is opt-in per caller rather than always
// considered, because it is the only backend that costs money and the only one whose invocations
// this package has never verified against a live service. `navigate` and `smoke` put it on their
// ladder as a *fallback*; `runtime:stop` and `runtime:reload` reach for it only when `--cloud`
// names it, so a session that happens to be up never quietly bills a run a local device would have
// served.

import { adbNotRunnableError, runAdbAsync, type AdbResolution } from '../device/adb';
import {
  CLOUD_SESSION_START_COMMAND,
  cloudPlatformUnknownError,
  cloudPlatformMismatchError,
  cloudSessionUnavailableError,
  cloudSessionUnknownError,
  probeCloudSessionAsync,
  type CloudSessionProbe,
} from '../device/cloudSimulator';
import { PROGRAM_PREFIX } from '../programName';
import { CommandError } from '../utils/errors';
import { spawnCaptureAsync } from '../utils/spawnCapture';
import { debugEvent } from './events';

export type NavigatePlatform = 'ios' | 'android';

/**
 * Which of the three device layers acted.
 *
 * Reported rather than inferred from `platform`, because `ios` no longer says where the device is:
 * a cloud session runs iOS too, and the difference decides whether the dev server has to be
 * tunnelled, whether `adb reverse` applies, and which command a reader can run by hand.
 */
export type DeviceBackend = 'local-ios' | 'local-android' | 'cloud';

export interface NavigateDevice {
  backend: DeviceBackend;
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
    device: {
      backend: 'local-ios',
      platform: 'ios',
      deviceId: simulator.udid,
      name: simulator.name || undefined,
    },
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
      backend: 'local-android',
      platform: 'android',
      deviceId: device.deviceId,
      adb,
      model: device.model ?? undefined,
    },
  };
}

/**
 * Look for a cloud simulator session this project can drive. Never throws: no session is an answer.
 *
 * **The service answers this, not the filesystem.** The first cut of this rung was gated on
 * `.env.eas-simulator` existing, which is cheaper and wrong in both directions: the file outlives
 * the session it names, and a session started by MCP, by another terminal, or by a
 * `simulator:start --json` never writes it. So the rung spawns one `eas simulator:list`, and the
 * cost of that is paid here on purpose — this is about to open a link on a device, and llp/0005
 * §Cloud simulator is where the split between this ladder and the instant suggestion ladders is
 * argued.
 *
 * `platform` is passed through as a **preference** for picking between several live sessions, not
 * as a filter: the caller compares afterwards, so a session on the other platform is reported as
 * one rather than hidden behind "no session".
 *
 * @see src/device/cloudSimulator.ts — where the argv lives, and how much of it has been verified.
 */
export async function probeCloudDeviceAsync(
  projectRoot: string,
  { platform = null }: { platform?: NavigatePlatform | null } = {}
): Promise<{ device: NavigateDevice | null; probe: CloudSessionProbe }> {
  const probe = await probeCloudSessionAsync({ projectRoot, platform });
  if (probe.state !== 'active' || probe.platform == null || probe.sessionId == null) {
    // A live session whose platform could not be read is not a device this can be handed: the URL
    // shape differs per platform. The caller raises `cloudPlatformUnknownError` for it.
    return { device: null, probe };
  }

  debugEvent('device_resolved', { platform: probe.platform, deviceId: probe.sessionId });
  return {
    device: {
      backend: 'cloud',
      platform: probe.platform,
      deviceId: probe.sessionId,
      // The session's own `--name` when it has one, because a project with several sessions up has
      // just had one chosen for it, and the name is what says which (llp/0005 §Cloud simulator).
      name: probe.sessionName ?? 'EAS Simulator session',
    },
    probe,
  };
}

/**
 * Resolve the device to open the deep link on.
 *
 * Three backends and one order. `--cloud` (`cloud: 'required'`) names the cloud session and nothing
 * else is looked at, because a caller that named a device meant that device. Otherwise a **local**
 * device wins: it is free, it is instant, and it is what a developer at a keyboard is looking at.
 * The cloud is the last rung, taken only when the local probes found nothing and this project has a
 * session on record — which composes with wave 9's answer for that machine: instead of only being
 * handed the URL, a run with a live session opens it.
 *
 * With no platform flag, macOS prefers a booted iOS simulator and falls back to Android, because
 * an iOS simulator is the device an Expo project on a Mac usually has open. Every other host has
 * no iOS simulator at all, so only Android is checked there.
 *
 * @throws {CommandError} when the requested platform, or no backend at all, has a device.
 */
export async function resolveDeviceAsync(
  platform?: NavigatePlatform,
  context: ResolveDeviceContext = {}
): Promise<NavigateDevice> {
  if (context.cloud === 'required') {
    return await resolveCloudDeviceAsync(platform, context);
  }

  if (platform === 'ios') {
    const probe = await probeIosSimulatorAsync();
    if (probe.device) {
      return probe.device;
    }
    if (probe.toolError) {
      throw probe.toolError;
    }
    const cloud = await cloudFallbackAsync('ios', context);
    if (cloud.device) {
      return cloud.device;
    }
    throw noDeviceError(
      'NO_IOS_DEVICE',
      [
        'No booted iOS simulator was found, so there is no device to open the deep link on.',
        `Why: ${probe.reason}.`,
        `How: boot a simulator (from Xcode, or with "xcrun simctl boot"), start the dev server with "${PROGRAM_PREFIX} dev --detach", then run this command again.`,
      ],
      context,
      cloud.probe
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
    const cloud = await cloudFallbackAsync('android', context);
    if (cloud.device) {
      return cloud.device;
    }
    throw noDeviceError(
      'NO_ANDROID_DEVICE',
      [
        'No Android device or emulator was found, so there is no device to open the deep link on.',
        `Why: ${probe.reason}.`,
        'How: start an emulator or connect a device, check that "adb devices" lists it, then run this command again.',
      ],
      context,
      cloud.probe
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

  // The cloud rung, before the tool failure and before the verdict: a machine whose `adb` will not
  // start is exactly the machine this backend is for, and a session that is up answers the question
  // whichever platform tool is missing.
  const cloud = await cloudFallbackAsync(undefined, context);
  if (cloud.device) {
    return cloud.device;
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
    context,
    cloud.probe
  );
}

/** How much of the ladder a caller wants: whether the cloud backend is on it, and how. */
export type CloudPreference =
  /** `--cloud`: the session is the device, and no local tool is even asked. */
  | 'required'
  /** The default for the device-facing commands: local first, cloud when there is none. */
  | 'fallback'
  /**
   * Never. The default, and what a `runtime:*` action keeps until `--cloud` names the backend.
   *
   * Not because the acts are impossible — the controller has `close <app-id>` and `open <url>`,
   * which is the whole of the stop-and-relaunch pair — but because a session **bills by the
   * minute**. A fallback that quietly reached one would spend somebody's money to answer a command
   * that asked about this machine (llp/0005 §Cloud simulator).
   */
  | 'off';

/** What the caller already worked out, and which backends it wants looked at. */
export interface ResolveDeviceContext {
  /** The URL that was resolved for the route, when the caller had got that far. */
  url?: string | null;
  /** Whether a dev server answered, so the URL is one something could act on now. */
  devServerRunning?: boolean;
  /** Whether the cloud backend is on this run's ladder. Defaults to `off`. */
  cloud?: CloudPreference;
  /** The project whose session is looked for. Required for anything but `off`. */
  projectRoot?: string;
}

/**
 * The cloud rung of the ladder, taken after the local probes found nothing.
 *
 * A session on the **other** platform is not this run's device: `--ios` named iOS, and an Android
 * session cannot open an iOS link. It is still reported, through the probe, so the failure can say
 * that a session exists and is not the one that was asked for.
 */
async function cloudFallbackAsync(
  platform: NavigatePlatform | undefined,
  context: ResolveDeviceContext
): Promise<{ device: NavigateDevice | null; probe: CloudSessionProbe | null }> {
  if (context.cloud !== 'fallback' || context.projectRoot == null) {
    return { device: null, probe: null };
  }
  const { device, probe } = await probeCloudDeviceAsync(context.projectRoot, { platform });
  const usable = device != null && (platform == null || device.platform === platform);
  return { device: usable ? device : null, probe };
}

/**
 * Resolve the cloud session as the device, for a run that named it.
 *
 * Every failure here is about the session rather than about this machine, which is why none of them
 * reuses {@link noDeviceError}: a caller that passed `--cloud` is not helped by "boot a simulator".
 */
async function resolveCloudDeviceAsync(
  platform: NavigatePlatform | undefined,
  context: ResolveDeviceContext
): Promise<NavigateDevice> {
  if (context.projectRoot == null) {
    throw new CommandError(
      'CLOUD_SIMULATOR_UNRESOLVED',
      'A cloud simulator was asked for and this command did not say which project to look for a session in, which is a bug in this CLI.'
    );
  }

  const { device, probe } = await probeCloudDeviceAsync(context.projectRoot, { platform });

  if (device) {
    if (platform != null && device.platform !== platform) {
      throw cloudPlatformMismatchError(platform, device.platform, device.deviceId);
    }
    return device;
  }

  if (probe.state === 'active' && probe.sessionId != null) {
    // The session is up and did not say what it is. A caller that named a platform has answered
    // that itself; one that did not is asked, rather than having a URL shape guessed for it.
    if (platform == null) {
      throw cloudPlatformUnknownError(probe.sessionId);
    }
    return {
      backend: 'cloud',
      platform,
      deviceId: probe.sessionId,
      name: 'EAS Simulator session',
    };
  }
  if (probe.state === 'unknown' || probe.state === 'active') {
    throw cloudSessionUnknownError(probe);
  }
  throw cloudSessionUnavailableError(probe);
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
function noDeviceError(
  code: string,
  lines: string[],
  context: ResolveDeviceContext,
  cloudProbe: CloudSessionProbe | null = null
): CommandError {
  const withUrl = context.url
    ? [
        ...lines,
        `Or: this is the URL for that route — ${context.url}${
          context.devServerRunning ? '' : ' (no dev server answered, so it may not load yet)'
        }. Open it on a phone, a cloud simulator, or anywhere else that can reach the dev server; "${PROGRAM_PREFIX} navigate <route> --print-url" prints it without looking for a device.`,
      ]
    : lines;

  // A session on record that this run could not use is the one alternative worth naming above the
  // URL: it is a device this CLI *can* drive, and the reader is one command away from it. Only when
  // there is one — a project that has never started a session gets the generic line above and no
  // advertisement for a paid feature it may not have.
  const cloudLine = cloudSessionLine(cloudProbe);
  const error = new CommandError(code, [...withUrl, ...(cloudLine ? [cloudLine] : [])].join('\n'));
  // A caller that has no device does not get one by running the same command again, so the `Try:`
  // is the mode that answers without one.
  error.suggestedCommand = context.url ? `${PROGRAM_PREFIX} navigate / --print-url` : undefined;
  return error;
}

/** The `Or:` line for a cloud session this project has on record and this run could not use. */
function cloudSessionLine(probe: CloudSessionProbe | null): string | null {
  if (probe == null) {
    return null;
  }
  if (probe.state === 'none') {
    // A live session of a type this CLI cannot drive is still worth naming: "no device found" next
    // to a running `serve-sim` is true and leaves the reader one command short of a device.
    return probe.otherSessionCount > 0
      ? `Or: this project has ${probe.otherSessionCount} running EAS Simulator session${
          probe.otherSessionCount === 1 ? '' : 's'
        } this CLI cannot drive — ${probe.reason ?? 'none of them is an agent-device session'}. Start one it can with "${CLOUD_SESSION_START_COMMAND}" and pass --cloud.`
      : null;
  }
  if (probe.state === 'active') {
    // Reached when the session is live and is for the *other* platform, or reported none.
    return `Or: this project has a running EAS Simulator session${
      probe.platform ? ` (${probe.platform})` : ''
    }, and it is not the device this run asked for. Run this command again with --cloud and no platform flag to use it.`;
  }
  return `Or: this project has an EAS Simulator session on record and it is not usable — ${probe.reason ?? 'the service did not report it as running'}. Start a new one with "${CLOUD_SESSION_START_COMMAND}" and pass --cloud.`;
}
