import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import { Log } from '../log';
import { CommandError } from '../utils/errors';
import {
  formatPrebuildChanges,
  getPrebuildStaleness,
  importFingerprint,
  nativeFingerprintOptions,
  readPrebuildFingerprintMarker,
  type PrebuildSourceChange,
  type ResolvedFingerprint,
} from '../utils/nativeFingerprint';
import { getConfigEnvMode, loadEnvFiles } from '../utils/nodeEnv';
import { debugEvent } from './events';
import { getInstalledFingerprintAndroidAsync } from './getInstalledFingerprintAndroidAsync';
import { getInstalledFingerprintIosAsync } from './getInstalledFingerprintIosAsync';
import type { InstalledAppDevice } from './installedFingerprint';

export type Platform = 'android' | 'ios';

/**
 * Map the `--platform` flag to the platforms to check. An omitted flag checks every platform
 * this machine can reach a device for; `explicit` records whether the user named the platforms,
 * which decides how unreachable devices affect the exit code.
 */
export function resolvePlatformOption(platform?: string): {
  platforms: Platform[];
  explicit: boolean;
} {
  const supportedPlatforms: Platform[] =
    process.platform === 'darwin' ? ['android', 'ios'] : ['android'];
  switch (platform) {
    case undefined:
      return { platforms: supportedPlatforms, explicit: false };
    case 'all':
      if (!supportedPlatforms.includes('ios')) {
        Log.warn('Skipping iOS: simulators are only available on macOS.');
      }
      return { platforms: supportedPlatforms, explicit: true };
    case 'android':
      return { platforms: ['android'], explicit: true };
    case 'ios':
      if (!supportedPlatforms.includes('ios')) {
        throw new CommandError('iOS simulators are only available on macOS.');
      }
      return { platforms: ['ios'], explicit: true };
    default:
      throw new CommandError(`Unsupported platform: ${platform}. Use "android", "ios", or "all".`);
  }
}

export type Options = {
  /** Value of the `--platform` flag; omitted means "all platforms with a reachable device". */
  platform?: string;
  /** Only check the device or simulator matching this name, UDID, or adb serial. */
  device?: string;
  /** Application ID (iOS bundle identifier / Android package name) to look for, instead of resolving it from the project. Requires a single `--platform`. */
  appId?: string;
  /** Print the result as JSON. */
  json?: boolean;
};

export type PlatformCheckResult = {
  status: 'up-to-date' | 'rebuild-required' | 'unknown';
  reason:
    | 'hash-match'
    | 'hash-mismatch'
    | 'prebuild-stale'
    | 'no-device'
    | 'app-not-installed'
    | 'no-embedded-fingerprint'
    | 'fingerprint-unavailable'
    | 'check-failed';
  /** Human-readable explanation and next step. */
  recommendation: string;
  /** Commands that bring the app up to date, in order. Empty when up to date. */
  commands: string[];
  device: InstalledAppDevice | null;
  installedHash: string | null;
  currentHash: string | null;
  prebuildStatus: 'fresh' | 'stale' | 'unknown' | 'not-applicable';
  /** Sources that made the native directories stale. Empty unless `prebuildStatus` is `stale`. */
  prebuildChanges: PrebuildSourceChange[];
  exitCode: 0 | 1 | 2 | 3;
};

export type NeedsRebuildResult = {
  projectRoot: string;
  platforms: Partial<Record<Platform, PlatformCheckResult>>;
  exitCode: number;
};

export async function needsRebuildAsync(projectRoot: string, options: Options): Promise<void> {
  const { platforms, explicit } = resolvePlatformOption(options.platform);
  if (options.appId && platforms.length !== 1) {
    throw new CommandError(
      'Specify a single --platform (android or ios) when using --app-id — application IDs are platform-specific.'
    );
  }

  // Evaluate the app config under the same environment as `expo prebuild` and `expo run:*`
  // (which exports its env to the native build that embeds the fingerprint). Without this,
  // a config that reads .env values would produce a different hash here. `getConfigEnvMode`
  // defaults to development and honors EXPO_CONFIG_MODE, the same override the other
  // config-evaluating commands use.
  loadEnvFiles(projectRoot, { mode: getConfigEnvMode(), silent: true });

  const result = await checkNeedsRebuildAsync(projectRoot, platforms, {
    explicit,
    device: options.device,
    appId: options.appId,
    // Print each platform as soon as its check completes; JSON stays one aggregate document.
    onPlatformResult: options.json ? undefined : printPlatformResult,
  });

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  }
  process.exitCode = result.exitCode;
}

export async function checkNeedsRebuildAsync(
  projectRoot: string,
  platforms: Platform[],
  {
    explicit,
    device,
    appId,
    onPlatformResult,
  }: {
    explicit: boolean;
    device?: string;
    appId?: string;
    /** Called as each platform's check completes, in completion order. */
    onPlatformResult?: (platform: Platform, result: PlatformCheckResult) => void;
  }
): Promise<NeedsRebuildResult> {
  const resolved = importFingerprint(projectRoot);

  const results: Partial<Record<Platform, PlatformCheckResult>> = {};
  const checks = await Promise.all(
    platforms.map((platform) =>
      checkPlatformAsync(projectRoot, platform, resolved, { device, appId })
        .catch((error) => {
          // The exit code is this command's API: environmental failures (adb, simctl, config
          // evaluation) must report "cannot determine" (3), not be mistaken for "rebuild" (1).
          // Debug events never reach stdout, keeping `--json` output parseable.
          debugEvent('platform_check_failed', {
            platform,
            error: debugEvent.error(error as Error),
          });
          return toCheckFailedResult(error);
        })
        .then((result) => {
          onPlatformResult?.(platform, result);
          return result;
        })
    )
  );
  platforms.forEach((platform, index) => {
    results[platform] = checks[index];
  });

  return {
    projectRoot,
    platforms: results,
    exitCode: aggregateExitCode(Object.values(results), { explicit }),
  };
}

async function checkPlatformAsync(
  projectRoot: string,
  platform: Platform,
  resolved: ResolvedFingerprint | null,
  { device, appId }: { device?: string; appId?: string }
): Promise<PlatformCheckResult> {
  const runCommand = `npx expo run:${platform}`;

  if (!resolved) {
    return {
      status: 'unknown',
      reason: 'fingerprint-unavailable',
      recommendation:
        'The `expo` package (which provides `expo/fingerprint`) could not be resolved in the project. Install dependencies first.',
      commands: [],
      device: null,
      installedHash: null,
      currentHash: null,
      prebuildStatus: 'unknown',
      prebuildChanges: [],
      exitCode: 3,
    };
  }

  const fingerprintPromise = resolved.Fingerprint.createFingerprintAsync(
    projectRoot,
    nativeFingerprintOptions(platform)
  );

  // Start reading the installed app while the fingerprint is computed — the (slow) Android
  // APK pull only needs the hash at comparison time. Both derived promises get a no-op catch:
  // without it, a reader failure after the prebuild check returns early, or a fingerprint
  // failure while a reader returns early (no device) without awaiting `expectedHash`, would
  // crash the CLI as an unhandled rejection. The real rejections still surface through the
  // `await`s further down.
  const expectedHash = fingerprintPromise.then((fingerprint) => fingerprint.hash);
  expectedHash.catch(() => {});
  const installedPromise =
    platform === 'ios'
      ? getInstalledFingerprintIosAsync(projectRoot, { expectedHash, device, appId })
      : getInstalledFingerprintAndroidAsync(projectRoot, { expectedHash, device, appId });
  installedPromise.catch(() => {});

  const fingerprint = await fingerprintPromise;

  // Stale generated native directories require `prebuild` (clean by default) before the build —
  // a plain rebuild would compile the old directories and embed the new hash, hiding the
  // problem. This check needs no device, so it runs first.
  let prebuildStatus: PlatformCheckResult['prebuildStatus'] = 'not-applicable';
  let prebuildChanges: PrebuildSourceChange[] = [];
  if (fs.existsSync(path.join(projectRoot, platform))) {
    const staleness = getPrebuildStaleness({
      marker: readPrebuildFingerprintMarker(projectRoot, platform),
      currentSources: fingerprint.sources,
      currentFingerprintVersion: resolved.version,
    });
    prebuildStatus = staleness.status;
    prebuildChanges = staleness.changes;
  }
  if (prebuildStatus === 'stale') {
    return {
      status: 'rebuild-required',
      reason: 'prebuild-stale',
      recommendation: `The app config or a config plugin changed after the native directories were generated${describeChanges(prebuildChanges)}. Regenerate them, then rebuild.`,
      commands: [`npx expo prebuild -p ${platform}`, runCommand],
      device: null,
      installedHash: null,
      currentHash: fingerprint.hash,
      prebuildStatus,
      prebuildChanges,
      exitCode: 2,
    };
  }

  const installed = await installedPromise;

  const base = {
    currentHash: fingerprint.hash,
    prebuildStatus,
    prebuildChanges,
  };

  switch (installed.status) {
    case 'no-device':
      return {
        ...base,
        status: 'unknown',
        reason: 'no-device',
        recommendation: device
          ? `No ${platform === 'ios' ? 'booted simulator' : 'connected device or emulator'} matched --device "${device}".`
          : platform === 'ios'
            ? 'No booted iOS simulator was found. Boot the simulator that has the app installed. Physical iOS devices are not supported.'
            : 'No authorized Android device or emulator is connected.',
        commands: [],
        device: null,
        installedHash: null,
        exitCode: 3,
      };
    case 'app-not-installed':
      return {
        ...base,
        status: 'unknown',
        reason: 'app-not-installed',
        recommendation: `The app (${installed.appId}) is not installed on ${installed.device.name}. Build and install it first.`,
        commands: [runCommand],
        device: installed.device,
        installedHash: null,
        exitCode: 3,
      };
    case 'no-embedded-fingerprint':
      return {
        ...base,
        status: 'unknown',
        reason: 'no-embedded-fingerprint',
        recommendation:
          'The installed app has no embedded fingerprint. It is a release build (only debug builds embed the fingerprint), was built before fingerprint embedding existed, or was built with EXPO_SKIP_FINGERPRINT_EMBED set. Install a debug build to enable detection.',
        commands: [runCommand],
        device: installed.device,
        installedHash: null,
        exitCode: 3,
      };
    case 'ok': {
      if (installed.hash === fingerprint.hash) {
        return {
          ...base,
          status: 'up-to-date',
          reason: 'hash-match',
          recommendation: 'The installed app matches the project. A JS reload is enough.',
          commands: [],
          device: installed.device,
          installedHash: installed.hash,
          exitCode: 0,
        };
      }
      return {
        ...base,
        status: 'rebuild-required',
        reason: 'hash-mismatch',
        recommendation: 'Native inputs changed since the installed app was built. Rebuild the app.',
        commands: [runCommand],
        device: installed.device,
        installedHash: installed.hash,
        exitCode: 1,
      };
    }
  }
}

function toCheckFailedResult(error: Error): PlatformCheckResult {
  return {
    status: 'unknown',
    reason: 'check-failed',
    recommendation: `The check failed: ${error.message}. Fix the underlying issue, or rebuild to be safe. Run with EXPO_DEBUG=1 for details.`,
    commands: [],
    device: null,
    installedHash: null,
    currentHash: null,
    prebuildStatus: 'unknown',
    prebuildChanges: [],
    exitCode: 3,
  };
}

/**
 * Name the changed sources in the recommendation, so the verdict answers "what changed?"
 * without a second command. The full list stays in `--json`.
 */
function describeChanges(changes: PrebuildSourceChange[]): string {
  return changes.length ? ` (${formatPrebuildChanges(changes)})` : '';
}

/**
 * The command's exit code is the worst per-platform code. Definitive answers outrank
 * indeterminate ones: 2 (prebuild + rebuild) > 1 (rebuild) > 3 (cannot determine) > 0.
 * Without an explicit `--platform`, platforms with no reachable device don't count
 * as long as another platform produced a definitive answer.
 */
function aggregateExitCode(
  results: PlatformCheckResult[],
  { explicit }: { explicit: boolean }
): number {
  let considered = results;
  if (!explicit) {
    const reachable = results.filter((result) => result.reason !== 'no-device');
    if (reachable.length) {
      considered = reachable;
    }
  }
  for (const code of [2, 1, 3] as const) {
    if (considered.some((result) => result.exitCode === code)) {
      return code;
    }
  }
  return 0;
}

function printPlatformResult(platform: Platform, check: PlatformCheckResult): void {
  const deviceSuffix = check.device ? chalk` {dim (${check.device.name})}` : '';
  if (check.status === 'up-to-date') {
    Log.log(
      chalk`{green ✓} {bold ${platform}}${deviceSuffix}: up to date — a JS reload is enough.`
    );
    return;
  }
  if (check.status === 'rebuild-required') {
    const title =
      check.reason === 'prebuild-stale' ? 'prebuild + rebuild required' : 'rebuild required';
    Log.log(chalk`{red ✗} {bold ${platform}}${deviceSuffix}: ${title}.`);
    Log.log(`  ${check.recommendation}`);
    if (check.installedHash) {
      Log.log(chalk`  installed: {dim ${check.installedHash}}`);
      Log.log(chalk`  current:   {dim ${check.currentHash}}`);
    }
  } else {
    Log.log(chalk`{yellow ?} {bold ${platform}}${deviceSuffix}: cannot determine.`);
    Log.log(`  ${check.recommendation}`);
  }
  for (const command of check.commands) {
    Log.log(chalk`  {cyan ${command}}`);
  }
}
