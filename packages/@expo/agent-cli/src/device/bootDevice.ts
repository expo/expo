// @ref llp/0005-runtime-loop-tools.rfc.md §The run brings its own environment
// Boot a local device, and shut one down again.
//
// The device probes next door (`src/navigate/device.ts`) answer "is there one", which is all every
// command before this needed: a run that found none reported that and stopped. `smoke` now brings
// its own, so somebody has to answer "make one", and this is the module that does — through the
// same platform tools as subprocesses, with no simulator or emulator library linked in.
//
// **Only what this module started is ever shut down.** Nothing here decides that; the caller does
// (`src/smoke/phases.ts`). What this module guarantees is the other half of it: `bootAsync` reports
// the id it booted before it waits for anything, so a boot that hangs is still a device its caller
// knows it is holding.
//
// Three live facts are pinned here rather than rediscovered, and each of them cost somebody a run:
//
//  1. **`-ports 5554,5555` on the emulator.** Without it the emulator binds ephemeral ports and
//     `adb devices` never lists it at all — not "offline", *absent* [observed — friction run 6,
//     F62, and again on 2026-08-27]. So the serial is known before the boot rather than after.
//  2. **`sys.boot_completed`, not `adb devices`.** `adb` reports the serial as `offline` for the
//     first seconds and then `device`, and Android itself is up later still. An `adb shell` before
//     that answers `device offline`.
//  3. **`simctl boot`, and never Simulator.app.** Opening the UI app is what needs a macOS
//     Automation grant, and a refusal there is the failure llp/0005 §The run brings its own environment
//     uses records for `expo start --ios`. `simctl boot` needs no grant, and `simctl openurl` and
//     `simctl io … screenshot` both work against a simulator whose window nobody opened.

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

import type { DeviceBackend } from '../navigate/device';
import { spawnCaptureAsync } from '../utils/spawnCapture';
import { resolveAdb, runAdbAsync, type AdbResolution } from './adb';
import { simulatorHasAppAsync } from './installedApps';

/** The serial an emulator started with `-ports 5554,5555` is always listed under. */
export const EMULATOR_SERIAL = 'emulator-5554';

/** How often a boot wait re-asks the device whether it is up. */
const BOOT_POLL_MS = 2_000;

/** What one boot amounted to. Never throws: a device that would not come up is a result. */
export interface BootDeviceResult {
  ok: boolean;
  /** The device that came up, or the one that was asked to and did not. */
  deviceId: string | null;
  backend: DeviceBackend | null;
  /** The name a person would recognise it by, when the tool reported one. */
  name: string | null;
  /** Why none came up, as one sentence. Null exactly when {@link ok} is true. */
  reason: string | null;
  /**
   * Nothing was booted **on purpose**, because no device could have opened the app.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §The device that can open the app
   * Distinct from an ordinary failure, and the distinction is the whole point of asking before
   * booting: a boot that could not have opened the app costs a minute and answers nothing, so
   * declining it is the *right* outcome and the report has to say so rather than describing a
   * simulator that would not start.
   */
  refused: boolean;
  /**
   * Why this device was chosen, for a report that has to explain itself.
   *
   * Null when none was. One clause, in the terms of the rule that picked it — "has Expo Go
   * installed", "already booted".
   */
  choice: string | null;
}

/** What one shutdown amounted to. Never throws, for the same reason. */
export interface ShutdownDeviceResult {
  ok: boolean;
  reason: string | null;
}

export interface BootDeviceOptions {
  /** How long the boot may take before it is called a failure. */
  timeoutMs: number;
  /**
   * Told the id as soon as there is one, and before the device is touched.
   *
   * The caller registers its cleanup from here, so a boot that is issued and then hangs is still
   * a device somebody is responsible for shutting down.
   */
  onBooting?: (device: { deviceId: string; backend: DeviceBackend }) => void;
  /** The clock, so a test can drive the wait without one. */
  now?: () => number;
  /** Injected for the tests: the emulator this host would spawn. */
  adb?: AdbResolution;
  /**
   * The application the caller is about to open, when it knows.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §The device that can open the app
   * Given, the boot only ever chooses a device that **has this app installed**, and declines
   * rather than booting one that could not open it. Absent, the choice is the ordering that was
   * here before — which is right for a caller that has no particular app in mind, and was wrong
   * for `smoke`, whose whole next phase is opening one.
   */
  appId?: string | null;
  /** What the app is called in a sentence, for the refusal. Defaults to {@link appId}. */
  appLabel?: string | null;
  /** The command that puts the app on a device, named by the refusal when there is one. */
  installWith?: string | null;
  /** Injected for the tests: which apps a simulator has. */
  hasAppAsync?: (udid: string, appId: string) => Promise<boolean>;
}

/** One simulator, as `simctl list devices -j` describes it. */
export interface SimulatorEntry {
  udid: string;
  name: string;
  /** The runtime identifier it is listed under, e.g. `com.apple.CoreSimulator.SimRuntime.iOS-26-0`. */
  runtime: string;
  /** iOS version as a comparable tuple, from the runtime identifier. */
  version: number[];
  state: string;
  isAvailable: boolean;
  /**
   * When this device was last booted, as epoch milliseconds. Zero for one that never has been.
   *
   * The field that decides the choice, and it is not about recency for its own sake. **Apps are
   * installed per device**, so a simulator nobody has ever booted has no Expo Go on it and no
   * development build either — a run that booted one would spend a minute and then fail at the
   * `app` phase against a device that could never have answered.
   */
  lastBootedAt: number;
}

/**
 * Read the bootable iOS simulators out of `simctl list devices -j`.
 *
 * Only iOS runtimes: a watchOS or tvOS simulator cannot run this project's app, and booting one
 * would be a minute spent on a device every phase after it would then fail against.
 *
 * Exported because it is the half of the iOS path that can be wrong without any simulator being
 * involved, and pinning it needs no Xcode.
 */
export function parseSimulators(stdout: string): SimulatorEntry[] {
  let parsed: {
    devices?: Record<
      string,
      {
        udid?: string;
        name?: string;
        state?: string;
        isAvailable?: boolean;
        lastBootedAt?: string;
      }[]
    >;
  };
  try {
    parsed = JSON.parse(stdout);
  } catch {
    return [];
  }

  const simulators: SimulatorEntry[] = [];
  for (const [runtime, devices] of Object.entries(parsed.devices ?? {})) {
    const version = runtime.match(/\.iOS-([\d-]+)$/)?.[1];
    if (version == null || !Array.isArray(devices)) {
      continue;
    }
    for (const device of devices) {
      if (device?.udid) {
        simulators.push({
          udid: device.udid,
          name: device.name ?? '',
          runtime,
          version: version.split('-').map(Number),
          state: device.state ?? 'Unknown',
          // Absent means available: `simctl` omits the key for the ordinary case and sets it false
          // for a device whose runtime is gone.
          isAvailable: device.isAvailable !== false,
          // `simctl` omits the key entirely for a device that has never been booted, which is
          // exactly the device this must not choose.
          lastBootedAt: Date.parse(device.lastBootedAt ?? '') || 0,
        });
      }
    }
  }
  return simulators;
}

/**
 * Choose the simulator to boot.
 *
 * **The one this developer last used**, and that is the whole rule rather than a tie-break. Apps
 * are installed per device: a simulator nobody has ever booted has no Expo Go on it and no
 * development build either, so a run that picked "the newest iPhone on the newest runtime" would,
 * on a machine with eleven simulators and one in use, spend a minute booting a device that could
 * never have answered the `app` phase. `lastBootedAt` is `simctl`'s own record of which one that
 * is [observed — 2026-08-30, a machine listing five iPhones and five iPads, one of them the
 * `iPhone 17 Pro` every live run of this package has used].
 *
 * The two rules under it are for a machine where nothing has ever been booted, which is a fresh
 * Xcode install: the newest iOS runtime, and an iPhone on it. An iPad is taken only when there is
 * no iPhone at all, because a run on some device is worth much more than a run on none.
 *
 * A simulator that is already `Booted` wins outright — the caller only reaches this when its probe
 * found none, so one here is a race, and joining it is better than booting a second.
 *
 * **`hasApp` outranks all of it**, and that is the correction the proxy above needed
 * (llp/0005 §The device that can open the app). "Most recently used" is a guess at "has the apps
 * on it"; the app itself is the fact. A dev-client project booted a fresh simulator on that guess
 * and the deep link came back `115` — no handler for the scheme — after a 12.4 s boot for a device
 * that could never have opened it [observed, 2026-08-30]. When no device
 * has the app this answers **null**, because a boot that cannot open the app is worse than no boot:
 * it costs the minute and answers nothing.
 *
 * `hasApp` absent is "nobody asked", which is not "the answer is no": a caller that does not know
 * which app it is about gets the ordering that was here before.
 */
export function pickSimulator(
  simulators: SimulatorEntry[],
  { hasApp }: { hasApp?: (simulator: SimulatorEntry) => boolean } = {}
): SimulatorEntry | null {
  const available = simulators.filter((simulator) => simulator.isAvailable);
  if (available.length === 0) {
    return null;
  }
  const alreadyUp = available.find((simulator) => simulator.state === 'Booted');
  if (alreadyUp) {
    return alreadyUp;
  }
  const usable = hasApp == null ? available : available.filter(hasApp);
  if (usable.length === 0) {
    return null;
  }
  const ranked = [...usable].sort((left, right) => {
    const byLastBooted = right.lastBootedAt - left.lastBootedAt;
    if (byLastBooted !== 0) {
      return byLastBooted;
    }
    const byVersion = compareVersions(right.version, left.version);
    if (byVersion !== 0) {
      return byVersion;
    }
    return Number(right.name.startsWith('iPhone')) - Number(left.name.startsWith('iPhone'));
  });
  return ranked[0] ?? null;
}

function compareVersions(left: number[], right: number[]): number {
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }
  return 0;
}

/** Read the AVD names out of `emulator -list-avds`. */
export function parseAvds(stdout: string): string[] {
  return (
    stdout
      .split('\n')
      .map((line) => line.trim())
      // The tool prints its own warnings to stdout on some SDKs, and none of them is an AVD name.
      .filter((line) => line.length > 0 && !line.includes(' '))
  );
}

/**
 * Boot a device for this platform, and wait until it will answer.
 *
 * @returns what came up, or why nothing did. Never rejects.
 */
export async function bootDeviceAsync(
  platform: 'ios' | 'android',
  options: BootDeviceOptions
): Promise<BootDeviceResult> {
  return platform === 'ios' ? await bootSimulatorAsync(options) : await bootEmulatorAsync(options);
}

/** Shut down a device this process booted. Never rejects. */
export async function shutdownDeviceAsync(
  deviceId: string,
  backend: DeviceBackend,
  { adb }: { adb?: AdbResolution } = {}
): Promise<ShutdownDeviceResult> {
  if (backend === 'local-ios') {
    const result = await spawnCaptureAsync('xcrun', ['simctl', 'shutdown', deviceId], {
      timeoutMs: 60_000,
    });
    if (result.spawnError) {
      return { ok: false, reason: `could not run "xcrun simctl": ${result.spawnError.message}` };
    }
    // A simulator that is already off is the state this asked for, and `simctl` says so with a
    // non-zero code. Reporting it as a failed cleanup would be reporting the outcome we wanted.
    if (result.exitCode !== 0 && !/current state: Shutdown/i.test(result.stderr)) {
      return {
        ok: false,
        reason: `"xcrun simctl shutdown ${deviceId}" exited ${result.exitCode}: ${firstLine(result.stderr) || 'no output'}`,
      };
    }
    return { ok: true, reason: null };
  }

  if (backend === 'local-android') {
    const result = await runAdbAsync(['-s', deviceId, 'emu', 'kill'], {
      adb,
      timeoutMs: 60_000,
    });
    if (result.notRunnable) {
      return {
        ok: false,
        reason: `"adb" could not be run (${result.spawnError?.message ?? 'no reason given'})`,
      };
    }
    return result.exitCode === 0
      ? { ok: true, reason: null }
      : {
          ok: false,
          reason: `"${result.adb.bin} -s ${deviceId} emu kill" exited ${result.exitCode}: ${firstLine(result.stderr) || 'no output'}`,
        };
  }

  // The cloud backend is not this module's to shut down, and it is never registered for cleanup:
  // a session is somebody's paid resource, started outside this run and outliving it on purpose
  // (llp/0005 §Cloud simulator).
  return {
    ok: false,
    reason: `${backend} is not a device this command boots, so it has nothing to shut down`,
  };
}

/** The iOS half: pick a simulator, boot it, and wait for `bootstatus` to say it is up. */
async function bootSimulatorAsync({
  timeoutMs,
  onBooting,
  now = Date.now,
  appId = null,
  appLabel = null,
  installWith = null,
  hasAppAsync = (udid, id) => simulatorHasAppAsync(udid, id),
}: BootDeviceOptions): Promise<BootDeviceResult> {
  const none = (reason: string, refused = false): BootDeviceResult => ({
    ok: false,
    deviceId: null,
    backend: null,
    name: null,
    reason,
    refused,
    choice: null,
  });
  const app = appLabel ?? appId;

  const deadline = now() + timeoutMs;
  const left = () => Math.max(1_000, deadline - now());

  const listed = await spawnCaptureAsync('xcrun', ['simctl', 'list', 'devices', '-j'], {
    timeoutMs: Math.min(60_000, left()),
  });
  if (listed.spawnError) {
    return none(
      `could not run "xcrun simctl", so no simulator could be booted: ${listed.spawnError.message}. Install Xcode and its command line tools, which provide it`
    );
  }
  if (listed.exitCode !== 0) {
    return none(
      `"xcrun simctl list devices" exited ${listed.exitCode}: ${firstLine(listed.stderr) || 'no output'}`
    );
  }

  const simulators = parseSimulators(listed.stdout);
  if (simulators.filter((entry) => entry.isAvailable).length === 0) {
    return none(
      `this machine has no iOS simulator to boot. Install an iOS runtime in Xcode's Settings › Components, then run this command again`
    );
  }

  // @ref ./bootDevice §pickSimulator. Asked **before** anything is booted, which is the whole
  // point: the answer decides between a minute well spent and a minute spent on a device that
  // could never have opened the app.
  const withApp =
    appId == null
      ? null
      : new Set(
          (
            await Promise.all(
              simulators.map(async (entry) =>
                (await hasAppAsync(entry.udid, appId)) ? entry.udid : null
              )
            )
          ).filter((udid): udid is string => udid != null)
        );

  const simulator = pickSimulator(
    simulators,
    withApp == null ? {} : { hasApp: (entry) => withApp.has(entry.udid) }
  );
  if (simulator == null) {
    // Nothing was booted, and that is the answer rather than a failure to boot: no simulator on
    // this machine has the app, so every one of them would have refused the deep link.
    return none(
      [
        `no iOS simulator has ${app} installed, so booting one would open nothing`,
        `— ${simulators.length} ${simulators.length === 1 ? 'simulator was' : 'simulators were'} looked at`,
        installWith ? `. Run "${installWith}" once to put the app on a simulator` : '',
      ].join(''),
      true
    );
  }

  const choice =
    simulator.state === 'Booted'
      ? 'it was already booted'
      : withApp == null
        ? 'it is the simulator this machine last used'
        : `it has ${app} installed`;

  // Before the boot, so the caller is holding it from here on (@ref ./bootDevice §onBooting).
  onBooting?.({ deviceId: simulator.udid, backend: 'local-ios' });

  const booted = await spawnCaptureAsync('xcrun', ['simctl', 'boot', simulator.udid], {
    timeoutMs: left(),
  });
  // "Unable to boot device in current state: Booted" is the race this run is happy to lose: the
  // device is up, which is the whole request.
  if (booted.exitCode !== 0 && !/current state: Booted/i.test(booted.stderr)) {
    return {
      ok: false,
      deviceId: simulator.udid,
      backend: 'local-ios',
      name: simulator.name,
      reason: `"xcrun simctl boot ${simulator.udid}" exited ${booted.exitCode}: ${firstLine(booted.stderr) || 'no output'}`,
      refused: false,
      choice,
    };
  }

  // `bootstatus` blocks until the device has finished booting, which is a different moment from
  // the boot command returning: `simctl boot` returns as soon as the boot has *started*, and an
  // `openurl` before springboard is up is refused.
  const status = await spawnCaptureAsync('xcrun', ['simctl', 'bootstatus', simulator.udid], {
    timeoutMs: left(),
  });
  if (status.exitCode !== 0) {
    return {
      ok: false,
      deviceId: simulator.udid,
      backend: 'local-ios',
      name: simulator.name,
      reason: `${simulator.name} (${simulator.udid}) was asked to boot and "xcrun simctl bootstatus" did not report it up within ${timeoutMs}ms`,
      refused: false,
      choice,
    };
  }

  return {
    ok: true,
    deviceId: simulator.udid,
    backend: 'local-ios',
    name: simulator.name,
    reason: null,
    refused: false,
    choice,
  };
}

/** The Android half: pick an AVD, spawn the emulator detached, and poll `sys.boot_completed`. */
async function bootEmulatorAsync({
  timeoutMs,
  onBooting,
  now = Date.now,
  adb: given,
}: BootDeviceOptions): Promise<BootDeviceResult> {
  const none = (reason: string): BootDeviceResult => ({
    ok: false,
    deviceId: null,
    backend: null,
    name: null,
    reason,
    refused: false,
    choice: null,
  });

  const adb = given ?? resolveAdb();
  const emulator = resolveEmulator(adb);
  const listed = await spawnCaptureAsync(emulator, ['-list-avds'], { timeoutMs: 60_000 });
  if (listed.spawnError) {
    return none(
      `could not run "${emulator}", so no emulator could be started: ${listed.spawnError.message}. Install the Android SDK's emulator package, or set ANDROID_HOME`
    );
  }
  const avd = parseAvds(listed.stdout)[0];
  if (avd == null) {
    return none(
      `this machine has no Android virtual device to start. Create one in Android Studio's Device Manager, then run this command again`
    );
  }

  // @ref ./bootDevice — `-ports 5554,5555`, without which `adb` never lists the emulator at all.
  // The serial is therefore known before the boot, which is what lets the cleanup be registered
  // here rather than after a wait that may never finish.
  onBooting?.({ deviceId: EMULATOR_SERIAL, backend: 'local-android' });

  let spawnFailure: string | null = null;
  try {
    const child = spawn(emulator, ['-avd', avd, '-ports', '5554,5555', '-no-snapshot-save'], {
      detached: true,
      // The emulator's own output is not this run's report, and a pipe nobody reads fills up and
      // blocks it. It logs to the Android SDK's own files either way.
      stdio: 'ignore',
    });
    child.on('error', (error: Error) => {
      spawnFailure = error.message;
    });
    child.unref();
  } catch (error: unknown) {
    return none(
      `"${emulator} -avd ${avd}" could not be started: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const deadline = now() + timeoutMs;
  for (;;) {
    if (spawnFailure != null) {
      return {
        ok: false,
        deviceId: EMULATOR_SERIAL,
        backend: 'local-android',
        name: avd,
        reason: `"${emulator} -avd ${avd}" could not be started: ${spawnFailure}`,
        refused: false,
        choice: 'it is the only Android virtual device this machine has',
      };
    }
    const probe = await runAdbAsync(
      ['-s', EMULATOR_SERIAL, 'shell', 'getprop', 'sys.boot_completed'],
      { adb, timeoutMs: 30_000 }
    );
    if (probe.exitCode === 0 && probe.stdout.trim() === '1') {
      return {
        ok: true,
        deviceId: EMULATOR_SERIAL,
        backend: 'local-android',
        name: avd,
        reason: null,
        refused: false,
        choice: 'it is the only Android virtual device this machine has',
      };
    }
    if (now() >= deadline) {
      return {
        ok: false,
        deviceId: EMULATOR_SERIAL,
        backend: 'local-android',
        name: avd,
        reason: `the emulator ${avd} did not finish booting within ${timeoutMs}ms — "${adb.bin} -s ${EMULATOR_SERIAL} shell getprop sys.boot_completed" never answered 1`,
        refused: false,
        choice: 'it is the only Android virtual device this machine has',
      };
    }
    await new Promise((resolve) => setTimeout(resolve, BOOT_POLL_MS));
  }
}

/**
 * The `emulator` binary to spawn.
 *
 * Beside the resolved `adb` when the SDK holds one, because that is the copy belonging to the SDK
 * every other Android call in this CLI uses — a bare `emulator` on `PATH` can be a different SDK's,
 * and an AVD created in one is not listed by the other.
 */
export function resolveEmulator(
  adb: AdbResolution,
  { exists = fs.existsSync }: { exists?: (candidate: string) => boolean } = {}
): string {
  const executable = process.platform === 'win32' ? 'emulator.exe' : 'emulator';
  const beside = path.join(path.dirname(path.dirname(adb.bin)), 'emulator', executable);
  return exists(beside) ? beside : executable;
}

function firstLine(text: string): string {
  return text.trim().split('\n')[0] ?? '';
}
