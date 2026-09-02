// @ref llp/0004-smart-start-and-project-state.rfc.md §Where a build runs
// Cheap probes for "can this machine build the app itself?". Two subprocesses at most for iOS and
// none at all for Android, cached for the life of the process, and wrapped so that nothing here can
// stop a plan being made: a probe that throws answers `unknown`, which reads as "not established".

import fs from 'fs';
import os from 'os';
import path from 'path';

import type { NativePlatform } from '../plan/types';
import { spawnCaptureAsync } from '../utils/spawnCapture';
import { findExecutableOnPath } from '../utils/subprocess';
import { localRequirement } from './runsOn';
import type { ToolchainProbe, ToolchainStatus } from './types';

/**
 * How long a probe may take before it is abandoned.
 *
 * `xcodebuild -version` reads a plist and exits; a first run after an Xcode update can take a
 * couple of seconds. Anything past this is a machine that will not answer, and a plan is not worth
 * holding up for it — the answer is `unknown`, which says exactly that.
 */
const PROBE_TIMEOUT_MS = 5_000;

/** Environment variables the Android tooling reads, in the order it reads them. */
const ANDROID_SDK_ENV_VARS = ['ANDROID_HOME', 'ANDROID_SDK_ROOT'] as const;

/** Join using the platform under test, so a mocked `process.platform` keeps POSIX paths. */
function hostJoin(...segments: string[]): string {
  return (process.platform === 'win32' ? path.win32 : path.posix).join(...segments);
}

function javaBinaries(home: string): string[] {
  const bin = hostJoin(home, 'bin');
  return process.platform === 'win32'
    ? [hostJoin(bin, 'java.exe'), hostJoin(bin, 'java.cmd'), hostJoin(bin, 'java')]
    : [hostJoin(bin, 'java')];
}

/**
 * One probe per platform per process.
 *
 * The promise is cached rather than the result, so two callers that ask at once share one run.
 */
const cache = new Map<NativePlatform, Promise<ToolchainProbe>>();

/** Forget what this process probed. For tests, and for nothing else. */
export function resetToolchainCache(): void {
  cache.clear();
}

/**
 * Can this machine build the app for `platform` itself?
 *
 * Never rejects and never throws: a plan that could not be made because a probe failed would be
 * worse than a plan that says it does not know.
 */
export function detectToolchainAsync(platform: NativePlatform): Promise<ToolchainProbe> {
  const cached = cache.get(platform);
  if (cached) {
    return cached;
  }
  const probe = runProbeAsync(platform);
  cache.set(platform, probe);
  return probe;
}

async function runProbeAsync(platform: NativePlatform): Promise<ToolchainProbe> {
  try {
    return platform === 'ios' ? await detectXcodeAsync() : await detectAndroidSdkAsync();
  } catch (error: any) {
    // Unknown, not missing. Nothing was learned about the machine, and saying otherwise would send
    // a caller to a cloud build over a toolchain this probe simply could not reach.
    return {
      platform,
      status: 'unknown',
      detail: `The ${platform} toolchain could not be probed: ${error?.message ?? String(error)}`,
      requirement: localRequirement(platform),
      caveats: [],
      impossible: false,
    };
  }
}

/**
 * Xcode, in the two questions that decide whether `expo run:ios` can work.
 *
 * `xcode-select -p` names the active developer directory, and `xcodebuild -version` is the one that
 * separates Xcode from the Command Line Tools: a machine with only the tools answers the first and
 * refuses the second, and it cannot build an app.
 */
async function detectXcodeAsync(): Promise<ToolchainProbe> {
  const requirement = localRequirement('ios');
  if (process.platform !== 'darwin') {
    // Settled by the host, so nothing is spawned: only macOS can build for iOS, whatever is
    // installed on this one.
    return {
      platform: 'ios',
      status: 'missing',
      detail: `An iOS build needs macOS with Xcode, and this machine runs ${process.platform}.`,
      requirement,
      caveats: [],
      // Not "you have not installed Xcode": Xcode does not exist for this host, so no install
      // here can change the answer and the only route to an iOS build is the cloud.
      impossible: true,
    };
  }

  const selected = await spawnCaptureAsync('xcode-select', ['-p'], {
    timeoutMs: PROBE_TIMEOUT_MS,
  });
  if (selected.spawnError) {
    return {
      platform: 'ios',
      status: 'missing',
      detail: `xcode-select is not on PATH, so no Xcode installation could be found (${selected.spawnError.code ?? selected.spawnError.message}).`,
      requirement,
      caveats: [],
      impossible: false,
    };
  }

  const developerDir = selected.stdout.trim();
  if (selected.exitCode !== 0 || !developerDir) {
    return {
      platform: 'ios',
      status: 'missing',
      detail: `xcode-select names no active developer directory: ${firstLine(selected.stderr) || `it exited ${selected.exitCode}`}`,
      requirement,
      caveats: [],
      impossible: false,
    };
  }

  const version = await spawnCaptureAsync('xcodebuild', ['-version'], {
    timeoutMs: PROBE_TIMEOUT_MS,
  });
  if (version.spawnError || version.exitCode !== 0) {
    const said = firstLine(version.stderr) || firstLine(version.stdout);
    return {
      platform: 'ios',
      status: 'missing',
      detail: `xcode-select points at ${developerDir} and xcodebuild does not run there, so this machine has the Command Line Tools rather than Xcode${said ? `: ${said}` : '.'}`,
      requirement,
      caveats: [],
      impossible: false,
    };
  }

  return {
    platform: 'ios',
    status: 'present',
    detail: `${firstLine(version.stdout) || 'Xcode'} at ${developerDir}.`,
    requirement,
    caveats: [],
    impossible: false,
  };
}

/**
 * The Android SDK, which is a directory, and the JVM, which is a command.
 *
 * Deliberately not "is `adb` on PATH?". A Gradle build finds the SDK through `ANDROID_HOME` or
 * `local.properties`, and this machine is the case that makes the difference concrete: the SDK is
 * where the installer put it, no environment variable names it, and `adb` is not on PATH. That is
 * a machine that can build and cannot run one shell command, so the SDK decides that half of the
 * status and the rest is reported as a caveat.
 *
 * **The other half is a JVM, and it cannot be answered from the disk** [F122, added 2026-08-27].
 * `gradlew` is a Java program, so a machine with the whole SDK and no runtime cannot build — and
 * macOS makes the file check useless in the direction that matters: it ships a `/usr/bin/java`
 * shim that exists, is on `PATH`, and exits 1 printing "Unable to locate a Java Runtime". So this
 * is one spawn, which is what it costs to tell those two machines apart, and the SDK question is
 * settled first so that a host with neither is told about the SDK without paying for it.
 */
async function detectAndroidSdkAsync(): Promise<ToolchainProbe> {
  const requirement = localRequirement('android');
  const named = ANDROID_SDK_ENV_VARS.map((name) => ({ name, value: readEnv(name) })).find(
    (entry) => entry.value
  );
  const sdkDir = named?.value ?? defaultAndroidSdkDir();
  const from = named ? `${named.name} names it` : 'the default install location';

  if (!sdkDir || !directoryExistsSync(sdkDir)) {
    return {
      platform: 'android',
      status: 'missing',
      detail: named
        ? `${named.name} names ${sdkDir}, and there is no directory there.`
        : `No Android SDK found: ANDROID_HOME and ANDROID_SDK_ROOT are unset, and the default location (${sdkDir}) does not exist.`,
      requirement,
      caveats: [],
      impossible: false,
    };
  }

  const caveats: string[] = [];
  const platformTools = hostJoin(sdkDir, 'platform-tools');
  if (!directoryExistsSync(platformTools)) {
    caveats.push(
      `The SDK at ${sdkDir} has no platform-tools directory, so adb is not installed in it yet; the Android tooling installs that package itself.`
    );
  } else if (!findExecutableOnPath('adb')) {
    caveats.push(
      `adb is not on PATH, though it is at ${platformTools}. A Gradle build finds the SDK without it; a command that talks to a device does not. Add ${platformTools} to PATH, and set ANDROID_HOME to ${sdkDir}.`
    );
  }
  if (!named) {
    caveats.push(
      `Neither ANDROID_HOME nor ANDROID_SDK_ROOT is set, so the SDK was found by looking in the default location.`
    );
  }

  const jvm = await detectJvmAsync();
  if (jvm.status !== 'present') {
    return {
      platform: 'android',
      // `unknown` when the probe was killed rather than answered, never rounded down to `missing`:
      // the rule the whole module follows, and here it decides between building and the cloud.
      status: jvm.status,
      // The SDK is named first whatever the JVM said, because "you have no Android SDK" would send
      // somebody to install one that is already on the disk.
      detail: `Android SDK at ${sdkDir} (${from}), and Gradle has no Java runtime to run on: ${jvm.detail}`,
      requirement,
      caveats,
      impossible: false,
    };
  }

  return {
    platform: 'android',
    status: 'present',
    detail: `Android SDK at ${sdkDir} (${from})${jvm.detail ? `, with ${jvm.detail}` : ''}.`,
    requirement,
    caveats,
    impossible: false,
  };
}

/**
 * Whether `gradlew` has a JVM to run on, in one spawn.
 *
 * `JAVA_HOME` is asked first because it is what Gradle itself reads before `PATH`, and only when
 * it names a `java` that is really there — a stale `JAVA_HOME` is common and pointing the probe at
 * a path with nothing on it would answer a question about the variable rather than the machine.
 */
async function detectJvmAsync(): Promise<{ status: ToolchainStatus; detail: string }> {
  const home = readEnv('JAVA_HOME');
  const named = home ? (javaBinaries(home).find(fileExistsSync) ?? null) : null;
  const command = named ?? 'java';

  const version = await spawnCaptureAsync(command, ['-version'], { timeoutMs: PROBE_TIMEOUT_MS });
  if (version.spawnError) {
    return {
      status: 'missing',
      detail: `no Java runtime is on PATH (${version.spawnError.code ?? version.spawnError.message}). Install a JDK, or set JAVA_HOME to one.`,
    };
  }
  if (version.exitCode == null) {
    // Killed or never answered. Nothing was established, so nothing is claimed.
    return { status: 'unknown', detail: `"${command} -version" did not answer.` };
  }
  if (version.exitCode !== 0) {
    // The macOS shim lands here: a file that exists, runs, and says there is no runtime behind it.
    const said = firstLine(version.stderr) || firstLine(version.stdout);
    return {
      status: 'missing',
      detail: `"${command} -version" exited ${version.exitCode}${said ? ` — ${said}` : ''} Install a JDK, or set JAVA_HOME to one.`,
    };
  }
  // `java -version` writes to stderr, which is not a mistake to correct for: it is where the JDK
  // has always put it, and reading stdout first would report an empty string for every JDK.
  return { status: 'present', detail: firstLine(version.stderr) || firstLine(version.stdout) };
}

/** Where the Android Studio installer puts the SDK, per host. */
function defaultAndroidSdkDir(): string {
  const home = os.homedir();
  if (process.platform === 'darwin') {
    return hostJoin(home, 'Library', 'Android', 'sdk');
  }
  if (process.platform === 'win32') {
    return hostJoin(
      process.env.LOCALAPPDATA || hostJoin(home, 'AppData', 'Local'),
      'Android',
      'Sdk'
    );
  }
  return hostJoin(home, 'Android', 'Sdk');
}

/** An environment variable that is set to something, treating an empty value as unset. */
function readEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : null;
}

function directoryExistsSync(dir: string): boolean {
  try {
    return fs.statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

function fileExistsSync(file: string): boolean {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

/** The first line worth quoting from a tool's output, or an empty string. */
function firstLine(output: string): string {
  return (
    output
      .split('\n')
      .map((line) => line.trim())
      .find(Boolean) ?? ''
  );
}
