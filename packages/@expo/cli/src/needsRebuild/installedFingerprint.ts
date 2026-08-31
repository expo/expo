/** Name of the fingerprint file that the expo-constants build phase embeds in the app. */
export const FINGERPRINT_FILE_NAME = 'app.fingerprint';

export type InstalledAppDevice = {
  name: string;
  /** Simulator UDID or adb device identifier. */
  identifier: string;
};

/** Result of reading the build-time fingerprint out of the installed app. */
export type InstalledFingerprintResult = (
  | { status: 'no-device' }
  | { status: 'app-not-installed'; appId: string; device: InstalledAppDevice }
  | {
      status: 'no-embedded-fingerprint';
      appId: string;
      device: InstalledAppDevice;
    }
  | { status: 'no-response'; appId: string; device: InstalledAppDevice }
  | { status: 'ok'; hash: string; appId: string; device: InstalledAppDevice }
) & {
  /**
   * Extra guidance to surface alongside the result, without changing its status. Used when a
   * booted simulator answers inconclusively while a physical device is also connected but not
   * automatically probed (probing it means launching the app on it).
   */
  hint?: string;
};

/**
 * Rank the evidence a device provides, so readers can pick the most informative device when
 * several are reachable: an app matching the expected hash beats any other installed app,
 * which beats an app without an embedded fingerprint, which beats a definitive "not installed",
 * which beats silence (a device that never answered the fingerprint-check trigger).
 */
export function rankInstalledResult(
  result: InstalledFingerprintResult,
  expectedHash: string
): number {
  switch (result.status) {
    case 'ok':
      return result.hash === expectedHash ? 4 : 3;
    case 'no-embedded-fingerprint':
      return 2;
    case 'app-not-installed':
      return 1;
    case 'no-response':
      return 0;
    default:
      return -1;
  }
}

/**
 * Pick the most informative result out of several devices, so a stale or unreachable device
 * cannot shadow a matching install on another one. Returns immediately when a result already
 * matches the expected hash — callers that probe devices one at a time (rather than collecting
 * every result first) can stop early on this signal.
 */
export function pickBestResult(
  results: InstalledFingerprintResult[],
  expectedHash: string
): InstalledFingerprintResult {
  let best: InstalledFingerprintResult = { status: 'no-device' };
  for (const result of results) {
    if (result.status === 'ok' && result.hash === expectedHash) {
      return result;
    }
    if (rankInstalledResult(result, expectedHash) > rankInstalledResult(best, expectedHash)) {
      best = result;
    }
  }
  return best;
}
