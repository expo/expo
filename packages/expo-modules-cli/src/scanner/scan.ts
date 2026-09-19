import {
  ScannerError,
  ScannerSchemaVersionError,
  getScannerBinaryPath,
  scanExports,
  type ScanExportsResult,
} from '@expo/expo-modules-macros-plugin';
import fs from 'fs';

export type ScanOptions = {
  /** A scanner executable to use instead of the one shipped with the macros plugin. */
  binaryPath?: string;
  /** The platform the scanner runs on; only overridden by tests. */
  platform?: NodeJS.Platform;
};

/**
 * Scans a package's Swift sources for their JS-exported surface through the macros plugin's
 * `scanExports`, turning its failures into messages that say what to do next.
 */
export async function scanPackage(
  packageDir: string,
  { binaryPath = getScannerBinaryPath(), platform = process.platform }: ScanOptions = {}
): Promise<ScanExportsResult> {
  if (!fs.existsSync(binaryPath)) {
    throw new Error(
      `The Expo Modules scanner executable was not found at ${binaryPath}. It is bundled with ` +
        `expo-modules-cli, so reinstall your JavaScript dependencies, or pass the path to a ` +
        `locally built scanner with --scanner.`
    );
  }
  try {
    return await scanExports([packageDir], { binaryPath });
  } catch (error) {
    if (error instanceof ScannerSchemaVersionError) {
      // The bundled scanner always matches this CLI, so a mismatch means a --scanner override.
      throw new Error(
        `The Expo Modules scanner at ${binaryPath} reports schema version ${error.found}, but this ` +
          `CLI understands version ${error.expected}. Pass a scanner built from the same release as ` +
          `this CLI with --scanner, or drop the option to use the bundled one.`
      );
    }
    if (error instanceof ScannerError && error.exitCode !== null) {
      // The scanner explains every failure on stderr, so its exit code adds nothing to the message.
      throw new Error(
        `The Expo Modules scanner failed to scan ${packageDir}. ` +
          `Fix the problem it reports below, then run the command again.\n${error.stderr.trim()}`
      );
    }
    if (error instanceof ScannerError) {
      // No exit code means the process never ran to completion: the binary could not be executed,
      // or it printed something other than a report. Off macOS the shipped binary cannot run at all,
      // and libc hands it to /bin/sh, so the failure does not name the real cause.
      const platformHint =
        platform === 'darwin'
          ? 'On macOS, make sure the file is executable'
          : `The bundled scanner is a macOS binary, so on ${platform} this command needs a locally ` +
            `built scanner`;
      throw new Error(
        `The Expo Modules scanner at ${binaryPath} did not produce a report: ${error.message}. ` +
          `${platformHint}, or pass the path to another scanner with --scanner.`
      );
    }
    throw error;
  }
}
