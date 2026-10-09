import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';

import { UserError } from './utils/errors';

/** The oldest Expo SDK whose local modules this CLI's template supports. */
export const MIN_SUPPORTED_LOCAL_SDK = 56;

/**
 * Gets the installed Expo SDK from the project or a parent workspace, or `null` when Expo isn't
 * installed there. Only searches node_modules in that tree, ignoring global dependencies from
 * NODE_PATH. Throws when an installed `expo/package.json` can't be parsed.
 */
export function getLocalSdkMajorVersion(projectRoot: string): number | null {
  for (let directory = path.resolve(projectRoot); ; directory = path.dirname(directory)) {
    const packagePath = path.join(directory, 'node_modules', 'expo', 'package.json');
    if (fs.existsSync(packagePath)) {
      const contents = fs.readFileSync(packagePath, 'utf8');
      let version: unknown;
      try {
        ({ version } = JSON.parse(contents));
      } catch (error: any) {
        throw new UserError(
          `Couldn't read the Expo SDK version from ${packagePath}: ${error.message}\n\n` +
            'The installed expo package looks corrupted. Reinstall the project dependencies and try again.'
        );
      }
      const major = parseInt(String(version), 10);
      return major > 0 ? major : null;
    }
    if (directory === path.dirname(directory)) {
      return null;
    }
  }
}

/**
 * Stops local module generation in an Expo SDK older than the template supports, unless the user
 * passed `--ignore-compatibility-check`. Does nothing when the SDK is unknown.
 */
export function assertSupportedLocalSdk(
  sdkVersion: number | null,
  ignoreCompatibilityCheck = false,
  suggestOlderCli = false
): void {
  if (sdkVersion == null || sdkVersion >= MIN_SUPPORTED_LOCAL_SDK) {
    return;
  }
  if (ignoreCompatibilityCheck) {
    console.warn(
      chalk.yellow(
        `Skipping the Expo SDK compatibility check. This template targets Expo SDK ${MIN_SUPPORTED_LOCAL_SDK} or later, ` +
          `so the generated native code may not build in this Expo SDK ${sdkVersion} project.`
      )
    );
    return;
  }
  const olderSdk = MIN_SUPPORTED_LOCAL_SDK - 1;
  throw new UserError(
    `This version of create-expo-module does not support local modules in Expo SDK ${sdkVersion}. ` +
      `It generates native code that needs Expo SDK ${MIN_SUPPORTED_LOCAL_SDK} or later.\n\n` +
      (suggestOlderCli
        ? `To create a local module for this SDK, use the SDK ${olderSdk} CLI:\n\n` +
          `  npx create-expo-module@sdk-${olderSdk} --local\n\n`
        : '') +
      "To continue anyway with this version's template, re-run the command with --ignore-compatibility-check."
  );
}
