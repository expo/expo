import semver from 'semver';

import logger from '../Logger';
import { spawnAsync } from '../Utils';

/**
 * Xcode version that prebuilds must be built with. Each Xcode bundles a specific Swift
 * compiler, and `.swiftinterface` files emitted by a newer Swift cannot be parsed by an
 * older one, which breaks consumers who haven't yet upgraded. Keep in sync with the CI
 * workflows that publish artifacts (see .github/workflows/publish-packages.yml).
 */
export const MINIMUM_XCODE_VERSION = '26.4.1';

// Returns major.minor.patch (`Xcode 26.4` → `26.4.0`); `null` when the prefix isn't found.
export function parseXcodeVersion(output: string): string | null {
  const match = output.match(/Xcode\s+(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) return null;
  return `${match[1]}.${match[2] ?? '0'}.${match[3] ?? '0'}`;
}

async function readXcodeVersionAsync(): Promise<string | null> {
  try {
    const { stdout } = await spawnAsync('xcodebuild', ['-version']);
    return parseXcodeVersion(stdout);
  } catch {
    return null;
  }
}

export async function ensureSupportedToolchainAsync(
  readActive: () => Promise<string | null> = readXcodeVersionAsync
): Promise<void> {
  const active = await readActive();
  if (active && semver.gte(active, MINIMUM_XCODE_VERSION)) {
    logger.log(`   Using active toolchain: Xcode ${active}`);
    return;
  }

  const activeDescription = active
    ? `Active toolchain is Xcode ${active}`
    : 'No active Xcode toolchain detected';
  throw new Error(
    `${activeDescription}, but iOS prebuilds require Xcode ${MINIMUM_XCODE_VERSION} or newer. ` +
      `Select a supported Xcode before running the precompile. ` +
      `It can be installed from https://developer.apple.com/download/all/.`
  );
}
