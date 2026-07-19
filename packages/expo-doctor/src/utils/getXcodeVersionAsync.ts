import spawnAsync from '@expo/spawn-async';

interface getXcodeVersionAsyncResult {
  xcodeVersion: string | null;
}
/**
 * Get the version of Xcode installed on the system
 * @returns {version: string | null}
 */
export async function getXcodeVersionAsync(): Promise<getXcodeVersionAsyncResult> {
  try {
    const xcodeVersionResponse = await spawnAsync('xcodebuild', ['-version']);
    const xcodeVersion = xcodeVersionResponse.stdout.trim();
    const versionMatch = xcodeVersion.match(/Xcode (\d+\.\d+(?:\.\d+)?)/);

    if (!versionMatch?.[1]) {
      return {
        xcodeVersion: null,
      };
    }

    // Convert to semantic version format (e.g., 16.2 -> 16.2.0)
    const semanticVersion =
      versionMatch[1].split('.').length === 2 ? `${versionMatch[1]}.0` : versionMatch[1];

    return {
      xcodeVersion: semanticVersion,
    };
  } catch {
    // not installed
    return {
      xcodeVersion: null,
    };
  }
}
