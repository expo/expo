import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { isRunningInExpoGo } from '../environment/ExpoGo';
import { getBundleOrigin } from '../utils/getBundleOrigin';

/**
 * Reason behind a {@link FingerprintCheckResult} status. The last four describe environments
 * where the check does not apply, and always come with the `not-applicable` status.
 */
export type FingerprintCheckReason =
  | 'hash-match'
  | 'hash-mismatch'
  | 'no-embedded-fingerprint'
  | 'fingerprint-unavailable'
  | 'check-failed'
  | 'production-build'
  | 'expo-go'
  | 'no-dev-server'
  | 'unsupported-platform';

export type FingerprintCheckResult = {
  /**
   * Verdict of the check. `up-to-date` means a JS reload is enough; `rebuild-required` means
   * the native app no longer matches the project; `unknown` means the check could not compare
   * the fingerprints; `not-applicable` means the environment has no fingerprint to check
   * (production builds, Expo Go, web, or no development server).
   */
  status: 'up-to-date' | 'rebuild-required' | 'unknown' | 'not-applicable';
  reason: FingerprintCheckReason;
  /** The hash embedded in the installed app at native build time, or `null` when it has none. */
  embeddedHash: string | null;
  /** The current project fingerprint from the development server, or `null`. */
  serverHash: string | null;
  /** Commands that bring the app up to date, in order. Empty unless a rebuild is required. */
  commands: string[];
};

function notApplicable(reason: FingerprintCheckReason): FingerprintCheckResult {
  return { status: 'not-applicable', reason, embeddedHash: null, serverHash: null, commands: [] };
}

/**
 * Checks whether the installed app still matches the project, by comparing the
 * [`@expo/fingerprint`](https://docs.expo.dev/versions/latest/sdk/fingerprint/) hash embedded
 * at native build time against the one the development server computes now. A mismatch means
 * native inputs changed and a JS reload is not enough.
 *
 * Needs a development build connected to a dev server. The promise never rejects: an
 * environment the check does not apply to answers `not-applicable`, a failure `check-failed`.
 *
 * @return A promise that resolves to the check result.
 *
 * @example
 * ```ts
 * import { checkFingerprintAsync } from 'expo';
 *
 * const result = await checkFingerprintAsync();
 * if (result.status === 'rebuild-required') {
 *   console.warn(`The installed app is stale. Run: ${result.commands.join(' && ')}`);
 * }
 * ```
 */
export async function checkFingerprintAsync(): Promise<FingerprintCheckResult> {
  if (!__DEV__) {
    return notApplicable('production-build');
  }
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return notApplicable('unsupported-platform');
  }
  if (isRunningInExpoGo()) {
    return notApplicable('expo-go');
  }
  let origin: string | null;
  try {
    origin = getBundleOrigin();
  } catch {
    // `new URL(...)` throws on a malformed bundle URL, and this promise never rejects.
    origin = null;
  }
  if (!origin) {
    return notApplicable('no-dev-server');
  }

  const embeddedHash = Constants.fingerprint ?? null;
  const headers: Record<string, string> = {};
  if (embeddedHash) {
    // One request both reads the server's hash and announces this app's own.
    headers['expo-fingerprint'] = embeddedHash;
  }

  let serverHash: string | null = null;
  let serverCommands: string[] | null = null;
  try {
    const response = await fetch(`${origin}/_expo/fingerprint?platform=${Platform.OS}`, {
      headers,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const reason =
        body?.code === 'FINGERPRINT_UNAVAILABLE' ? 'fingerprint-unavailable' : 'check-failed';
      return { status: 'unknown', reason, embeddedHash, serverHash: null, commands: [] };
    }
    const body = await response.json();
    serverHash = body?.hash ?? null;
    serverCommands = parseMismatchCommands(body);
  } catch {
    // Network errors, and dev servers without the endpoint (older CLIs respond with HTML).
    return {
      status: 'unknown',
      reason: 'check-failed',
      embeddedHash,
      serverHash: null,
      commands: [],
    };
  }

  if (!serverHash) {
    return {
      status: 'unknown',
      reason: 'check-failed',
      embeddedHash,
      serverHash: null,
      commands: [],
    };
  }
  if (!embeddedHash) {
    return {
      status: 'unknown',
      reason: 'no-embedded-fingerprint',
      embeddedHash: null,
      serverHash,
      commands: [],
    };
  }
  if (embeddedHash === serverHash) {
    return { status: 'up-to-date', reason: 'hash-match', embeddedHash, serverHash, commands: [] };
  }
  return {
    status: 'rebuild-required',
    reason: 'hash-mismatch',
    embeddedHash,
    serverHash,
    // The server's advice wins: only it knows whether `prebuild` has to run first.
    commands: serverCommands ?? [`npx expo run:${Platform.OS}`],
  };
}

/** Validate `mismatch.commands` from the response; older dev servers don't send it. */
function parseMismatchCommands(body: any): string[] | null {
  const commands = body?.mismatch?.commands;
  if (
    Array.isArray(commands) &&
    commands.length > 0 &&
    commands.every((command) => typeof command === 'string')
  ) {
    return commands;
  }
  return null;
}
