import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';

import { UserError } from './utils/errors';

export const MODULES_API_VERSIONS = ['v1', 'v2'] as const;
export type ModulesApi = (typeof MODULES_API_VERSIONS)[number];

/** The oldest Expo SDK whose modules can use the Expo Modules API 2.0. */
const MIN_MODULES_API_V2_SDK = 58;

/**
 * Gets the template directory with the Expo Modules API 2.0 files. Templates published before
 * these files were added don't have it.
 */
export function getModulesApiV2Dir(templatePath: string): string {
  return path.join(templatePath, 'snippets', 'v2');
}

/**
 * Resolves the Expo Modules API version of the generated native code. The default, Expo Modules
 * API 2.0, falls back to 1.0 when the template or the project's Expo SDK doesn't support it.
 */
export function resolveModulesApi(
  requested: ModulesApi | undefined,
  templatePath: string,
  sdkVersion: number | null
): ModulesApi {
  if (requested === 'v1') {
    return 'v1';
  }
  const reason = getModulesApiV2UnsupportedReason(templatePath, sdkVersion);
  if (!reason) {
    return 'v2';
  }
  if (requested === 'v2') {
    throw new UserError(
      `Cannot generate Expo Modules API 2.0 code, because ${reason}.\n\n` +
        'Re-run the command with --modules-api v1 to use the Expo Modules API 1.0.'
    );
  }
  console.log(chalk.yellow(`⚠️  Using the Expo Modules API 1.0, because ${reason}.`));
  return 'v1';
}

function getModulesApiV2UnsupportedReason(
  templatePath: string,
  sdkVersion: number | null
): string | null {
  if (sdkVersion != null && sdkVersion < MIN_MODULES_API_V2_SDK) {
    return `the project uses Expo SDK ${sdkVersion} and the API needs Expo SDK ${MIN_MODULES_API_V2_SDK} or later`;
  }
  if (!fs.existsSync(getModulesApiV2Dir(templatePath))) {
    return 'this version of the module template does not include it';
  }
  return null;
}
