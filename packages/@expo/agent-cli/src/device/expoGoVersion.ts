// @ref llp/0005-runtime-loop-tools.rfc.md §The Expo Go on the device is not the Expo Go the SDK wants
// @ref llp/0001-agentic-cli-on-expo-cli.rfc.md — constraint 5, on subprocesses
//
// Expo Go being *installed* is not Expo Go being the *right* Expo Go.
//
// Its native runtime is versioned with the SDK: the copy that runs an SDK 57 project is built from
// SDK 57, and the copy on a simulator nobody has opened since the spring is built from something
// else. `smoke` chose its device by asking which simulator *has* `host.exp.Exponent`
// (`./installedApps.ts`) and trusted whatever it found, so a stale Expo Go was the app under test
// and the gate never said so.
//
// Two questions, two sources, and neither of them is `@expo/cli`'s:
//
// - What is installed: `plutil` over the app bundle's own `Info.plist`, which is the same read
//   `./installedApps.ts` already does for `CFBundleIdentifier`. No network, no device boot.
// - What the SDK wants: the `expo-go` CLI (`npx expo-go url <platform> <sdk> --json`), as a
//   subprocess. `@expo/cli` answers this in `ExpoGoInstaller`, which is exactly the internal this
//   package may not import — and `expo-go` is the Expo-maintained CLI whose whole job it is.

import path from 'path';

import { EXPO_GO_APP_IDS } from '../navigate/target';
import { spawnCaptureAsync } from '../utils/spawnCapture';
import { appBundleDirs, readBundleIdAsync, simulatorDeviceDir } from './installedApps';

/** How long `plutil` gets to read one `Info.plist`. Generous: it reads a file and exits. */
const PLUTIL_TIMEOUT_MS = 5_000;

/**
 * How long the `expo-go` CLI gets to answer.
 *
 * It resolves a release over the network, and this runs inside a `smoke` whose budget belongs to
 * reading the app. Short enough that a machine with no route out answers this run rather than
 * holding it: the verdict for a check that timed out is `unknown`, which costs the caller nothing.
 */
const EXPO_GO_CLI_TIMEOUT_MS = 15_000;

/** The `expo-go` release URL shape, whose last path segment carries the version. */
const RELEASE_VERSION = /Expo-Go-(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/;

/**
 * The version in an `expo-go` download URL, or null when the URL does not carry one.
 *
 * Null rather than a guess, and that is the rule the whole module follows: a wrong "expected
 * version" would invent a mismatch, and an invented mismatch is worse than saying nothing.
 */
export function expoGoVersionFromUrl(url: string): string | null {
  return RELEASE_VERSION.exec(url)?.[1] ?? null;
}

/** What comparing the installed Expo Go against the SDK's own amounted to. */
export interface ExpoGoVersionCheck {
  /**
   * What the comparison established.
   *
   * **Exact equality, the way `@expo/cli` does it** [confirmed, Kudo, 2026-09-03]. Its
   * `ExpoGoInstaller.isInstalledClientVersionMismatched` is `!semver.eq(installed, expected)`, and
   * a first cut here split a different release line from an older patch of the same one so it could
   * fail the run for the first and merely mention the second. That distinction is the wrong tool:
   * the answer to a wrong version is not a better sentence about it, it is the right version — and
   * `@expo/cli` installs it rather than reporting it. Newer than expected is a mismatch too, for
   * the same reason it is there: the release this SDK ships is the one under test.
   *
   * `unknown` is every case where one of the two versions could not be had: offline, no `expo-go` on
   * the machine, an unreadable `Info.plist`, a version string nothing can parse. A check that could
   * not run must not become a refusal.
   */
  verdict: 'match' | 'mismatch' | 'unknown';
  /** The version on the device, or null when it could not be read. */
  installed: string | null;
  /** The version this project's SDK wants, or null when it could not be resolved. */
  expected: string | null;
  /**
   * One sentence about the answer. Null exactly for `match`.
   *
   * Carried with the verdict so a report never re-derives it, and so nothing downstream has to
   * match English to act (llp/0021 §The rules).
   */
  reason: string | null;
}

/** The `major.minor.patch` of a version string, or null when it is not one. */
function parts(version: string): [number, number, number] | null {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version.trim());
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

/**
 * Compare the Expo Go on the device against the one this project's SDK wants.
 *
 * Pure, so every row of the table above is testable without a simulator or a network.
 */
export function compareExpoGoVersion(
  installed: string | null,
  expected: string | null
): ExpoGoVersionCheck {
  const unknown = (reason: string): ExpoGoVersionCheck => ({
    verdict: 'unknown',
    installed,
    expected,
    reason,
  });

  if (installed == null && expected == null) {
    return unknown(
      'neither the Expo Go on the device nor the one this SDK wants could be read, so nothing was compared'
    );
  }
  if (installed == null) {
    return unknown(
      'the Expo Go on the device did not report a version, so it could not be compared with the one this SDK wants'
    );
  }
  if (expected == null) {
    return unknown(
      `the Expo Go on the device is ${installed}, and the version this SDK wants could not be resolved — so nothing was compared`
    );
  }

  const [a, b] = [parts(installed), parts(expected)];
  if (a == null || b == null) {
    return unknown(
      `"${a == null ? installed : expected}" is not a version this can read, so nothing was compared`
    );
  }

  if (a[0] === b[0] && a[1] === b[1] && a[2] === b[2]) {
    return { verdict: 'match', installed, expected, reason: null };
  }

  // One value, and a sentence that still says which kind it is: a different release line and an
  // older patch of the same one need the same action and read very differently to a person.
  return {
    verdict: 'mismatch',
    installed,
    expected,
    reason:
      a[0] === b[0]
        ? `the Expo Go on the device is ${installed}, and ${expected} is the release this SDK ships`
        : `the Expo Go on the device is ${installed}, and this project's SDK ships ${expected} — a different release line, whose runtime does not carry this SDK's native modules`,
  };
}

export interface ReadInstalledExpoGoVersionOptions {
  homedir?: string;
  /** Injected for the tests, so the layout can be pinned without a simulator. */
  bundleDirs?: (deviceDir: string) => string[];
  readBundleIdAsync?: (appBundleDir: string) => Promise<string | null>;
  readShortVersionAsync?: (appBundleDir: string) => Promise<string | null>;
}

/** One bundle's `CFBundleShortVersionString`, or null when it could not be read. */
export async function readBundleShortVersionAsync(appBundleDir: string): Promise<string | null> {
  const result = await spawnCaptureAsync(
    'plutil',
    [
      '-extract',
      'CFBundleShortVersionString',
      'raw',
      '-o',
      '-',
      path.join(appBundleDir, 'Info.plist'),
    ],
    { timeoutMs: PLUTIL_TIMEOUT_MS }
  );
  if (result.spawnError || result.exitCode !== 0) {
    return null;
  }
  return result.stdout.trim() || null;
}

/**
 * The version of the Expo Go installed on one simulator, or null when there is none to read.
 *
 * Never throws. The bundle is found the way `./installedApps.ts` finds any app — by reading each
 * bundle's own `CFBundleIdentifier` — rather than by trusting a directory name, because the
 * container uuid is the container's and says nothing about which app is in it.
 */
export async function readInstalledExpoGoVersionAsync(
  udid: string,
  {
    homedir,
    bundleDirs = (deviceDir) => appBundleDirs(deviceDir),
    readBundleIdAsync: readId = readBundleIdAsync,
    readShortVersionAsync: readVersion = readBundleShortVersionAsync,
  }: ReadInstalledExpoGoVersionOptions = {}
): Promise<string | null> {
  for (const bundle of bundleDirs(simulatorDeviceDir(udid, { homedir }))) {
    const id = await readId(bundle);
    if (id != null && EXPO_GO_APP_IDS.includes(id)) {
      return await readVersion(bundle);
    }
  }
  return null;
}

/**
 * What the `expo-go` CLI says this SDK's Expo Go release is, or null with the reason it does not.
 *
 * A subprocess, per llp/0001 constraint 5, and one whose failures are all ordinary: a machine with
 * no network, a registry that will not answer, an SDK the CLI has no release for. Every one of them
 * is a null here and an `unknown` verdict above — never a thrown error, because a `smoke` run whose
 * app is otherwise readable must not be ended by a version lookup.
 */
export async function resolveExpectedExpoGoVersionAsync(
  platform: 'ios' | 'android',
  sdkVersion: string | null,
  {
    spawn = spawnCaptureAsync,
    offline = process.env.EXPO_OFFLINE != null && process.env.EXPO_OFFLINE !== '0',
  }: { spawn?: typeof spawnCaptureAsync; offline?: boolean } = {}
): Promise<{ version: string | null; reason: string | null }> {
  if (sdkVersion == null) {
    return {
      version: null,
      reason: 'this project reports no SDK version, so there is no Expo Go release to ask about',
    };
  }
  // The same courtesy `@expo/cli` extends offline: it skips Expo Go version validation rather than
  // failing, because the alternative is a tool that stops working on a train.
  if (offline) {
    return { version: null, reason: 'EXPO_OFFLINE is set, so no release was looked up' };
  }

  const result = await spawn('npx', ['--yes', 'expo-go', 'url', platform, sdkVersion, '--json'], {
    timeoutMs: EXPO_GO_CLI_TIMEOUT_MS,
  });
  if (result.spawnError) {
    return {
      version: null,
      reason: `the expo-go CLI could not be run (${result.spawnError.code ?? result.spawnError.message})`,
    };
  }

  // `--json` is one object either way: `{"url":…}` at exit 0, `{"error":…}` at exit 1. Its own
  // sentence is quoted rather than replaced, because it names the SDK it could not find.
  let payload: { url?: unknown; error?: unknown } | null = null;
  try {
    payload = JSON.parse(result.stdout.trim());
  } catch {
    payload = null;
  }
  if (payload == null || typeof payload !== 'object') {
    return {
      version: null,
      reason: `the expo-go CLI answered nothing this could read${result.exitCode == null ? ' and did not exit' : ` (exit ${result.exitCode})`}`,
    };
  }
  if (typeof payload.error === 'string') {
    return { version: null, reason: `the expo-go CLI said: ${payload.error}` };
  }
  if (typeof payload.url !== 'string') {
    return { version: null, reason: 'the expo-go CLI answered no download URL' };
  }

  const version = expoGoVersionFromUrl(payload.url);
  return {
    version,
    reason:
      version == null
        ? `the expo-go CLI answered a URL with no version in it (${payload.url})`
        : null,
  };
}

/**
 * The whole check, for one simulator and one SDK.
 *
 * **The local read gates the network one**, rather than the two running together. Reading the
 * device's own `Info.plist` is a file read; resolving the release is a subprocess and a request. If
 * there is no installed version to compare, there is nothing the second answer could be compared
 * *to* — so spending it would buy a more detailed way of saying "unknown". This is also what keeps
 * the e2e tier hermetic: a fixture with no Expo Go bundle on its simulator makes no network call.
 */
export async function checkExpoGoVersionAsync(
  udid: string,
  platform: 'ios' | 'android',
  sdkVersion: string | null,
  {
    resolveExpectedAsync = resolveExpectedExpoGoVersionAsync,
    ...options
  }: ReadInstalledExpoGoVersionOptions & {
    /** Injected for the tests, so the table above is provable without a subprocess. */
    resolveExpectedAsync?: typeof resolveExpectedExpoGoVersionAsync;
  } = {}
): Promise<ExpoGoVersionCheck> {
  const installed = await readInstalledExpoGoVersionAsync(udid, options);
  if (installed == null) {
    return compareExpoGoVersion(null, null);
  }
  const expected = await resolveExpectedAsync(platform, sdkVersion);
  const check = compareExpoGoVersion(installed, expected.version);
  // The CLI's own sentence is the more useful one when it is the reason nothing was compared: it
  // names the SDK, or the network, rather than saying "could not be resolved" twice.
  return check.verdict === 'unknown' && expected.reason != null
    ? { ...check, reason: expected.reason }
    : check;
}
