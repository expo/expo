/** Name of the fingerprint file that the expo-constants build phase embeds in the app. */
export const FINGERPRINT_FILE_NAME = 'app.fingerprint';

export type InstalledAppDevice = {
  name: string;
  /** Simulator UDID or adb device identifier. */
  identifier: string;
};

/** Result of reading the build-time fingerprint out of the installed app. */
export type InstalledFingerprintResult =
  | { status: 'no-device' }
  | { status: 'app-not-installed'; appId: string; device: InstalledAppDevice }
  | {
      status: 'no-embedded-fingerprint';
      appId: string;
      device: InstalledAppDevice;
    }
  | { status: 'ok'; hash: string; appId: string; device: InstalledAppDevice };

/**
 * Rank the evidence a device provides, so readers can pick the most informative device when
 * several are reachable: an app matching the expected hash beats any other installed app,
 * which beats an app without an embedded fingerprint, which beats "not installed".
 */
export function rankInstalledResult(
  result: InstalledFingerprintResult,
  expectedHash: string
): number {
  switch (result.status) {
    case 'ok':
      return result.hash === expectedHash ? 3 : 2;
    case 'no-embedded-fingerprint':
      return 1;
    case 'app-not-installed':
      return 0;
    default:
      return -1;
  }
}
