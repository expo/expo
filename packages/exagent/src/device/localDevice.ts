// @ref llp/0009-smart-followups.rfc.md §Device-aware ladders
// Does this machine have a device to open an app on?
//
// Every rung of the CLI's ladders that reaches a screen — `exagent navigate /`, the screenshot
// follow-up, `status`'s own `next` line — needs a *local* device: a booted iOS simulator, or an
// Android device `adb` can see. A dogfood session drove Expo Go on a **cloud** simulator through a
// tunnel, from a machine with neither, and every one of those suggestions was an instruction to run
// something that could not work [observed — 2026-08-24]. The CLI had no way to know, because it had
// never asked.
//
// So it asks, once per process, and the answer has three values rather than two. `absent` is the
// one that changes what is suggested, and it may only be given by a platform tool that **ran** and
// reported nothing. A tool that is not installed establishes nothing — a Linux machine with no
// `adb` is not a machine with no device — and that case answers `unknown`, which leaves every
// ladder exactly as it was.

import {
  probeAndroidDeviceAsync,
  probeIosSimulatorAsync,
  type DeviceProbe,
  type NavigateDevice,
} from '../navigate/device';

/** What this machine has to open an app on. */
export type LocalDeviceState =
  /** A booted simulator or an attached device was found. */
  | 'present'
  /** A platform tool ran and reported none. */
  | 'absent'
  /** Nothing could be established, so nothing may be concluded. */
  | 'unknown';

export interface LocalDeviceProbe {
  state: LocalDeviceState;
  /** The device that was found, when one was. */
  device: NavigateDevice | null;
  /** Why the state is what it is, for a report that has to explain itself. Null when `present`. */
  reason: string | null;
}

/** Options of {@link probeLocalDeviceAsync}, for tests and for nothing else. */
export interface ProbeLocalDeviceOptions {
  /** The platform probes to run. Defaults to the ones this host can have. */
  probesAsync?: () => Promise<DeviceProbe[]>;
}

/**
 * One probe per process.
 *
 * The promise is cached rather than the result, so the several callers of one command — the status
 * sections and its follow-ups, say — share a single pair of subprocesses.
 */
let cached: Promise<LocalDeviceProbe> | null = null;

/** Forget what this process probed. For tests, and for nothing else. */
export function resetLocalDeviceCache(): void {
  cached = null;
}

/**
 * Whether this machine has a device to open an app on.
 *
 * Never rejects: a suggestion ladder must not be the thing that fails a command, so a probe that
 * throws answers `unknown` and every caller carries on as it did before this existed.
 */
export function probeLocalDeviceAsync(
  options: ProbeLocalDeviceOptions = {}
): Promise<LocalDeviceProbe> {
  cached ??= runProbesAsync(options);
  return cached;
}

async function runProbesAsync(options: ProbeLocalDeviceOptions): Promise<LocalDeviceProbe> {
  try {
    return readLocalDeviceProbe(await (options.probesAsync ?? defaultProbesAsync)());
  } catch (error: unknown) {
    return {
      state: 'unknown',
      device: null,
      reason: `the device probe could not run: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/** The platform probes worth running on this host: iOS simulators only exist on macOS. */
async function defaultProbesAsync(): Promise<DeviceProbe[]> {
  return await Promise.all([
    ...(process.platform === 'darwin' ? [probeIosSimulatorAsync()] : []),
    probeAndroidDeviceAsync(),
  ]);
}

/**
 * Fold the platform probes into one answer.
 *
 * Pure, so the rule that decides `absent` from `unknown` is testable without a simulator: a device
 * anywhere wins; otherwise one tool that ran and found nothing is enough to say `absent`; and a
 * round where nothing ran is `unknown`.
 */
export function readLocalDeviceProbe(probes: DeviceProbe[]): LocalDeviceProbe {
  const found = probes.find((probe) => probe.device);
  if (found?.device) {
    return { state: 'present', device: found.device, reason: null };
  }

  const answered = probes.filter((probe) => !probe.unavailable);
  const reason = probes
    .map((probe) => probe.reason)
    .filter(Boolean)
    .join('; ');

  if (answered.length === 0) {
    return {
      state: 'unknown',
      device: null,
      reason: reason || 'no platform tool could be run, so nothing is known about this machine',
    };
  }
  return {
    state: 'absent',
    device: null,
    reason: reason || 'no device was found',
  };
}
