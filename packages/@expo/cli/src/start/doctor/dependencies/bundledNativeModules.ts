import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import resolveFrom from 'resolve-from';

import { getNativeModuleVersionsAsync } from '../../../api/getNativeModuleVersions';
import { APISettings } from '../../../api/settings';
import * as Log from '../../../log';
import { CommandError } from '../../../utils/errors';

const debug = require('debug')(
  'expo:doctor:dependencies:bundledNativeModules'
) as typeof console.log;

export type BundledNativeModules = Record<string, string>;

/**
 * Gets the bundledNativeModules.json for a given SDK version:
 * - Tries to fetch the data from the /sdks/:sdkVersion/native-modules API endpoint.
 * - If the data is missing on the server (it can happen for SDKs that are yet fully released)
 *    or there's a downtime, reads the local .json file from the "expo" package.
 * - For UNVERSIONED, returns the local .json file contents.
 */
export async function getVersionedNativeModulesAsync(
  projectRoot: string,
  sdkVersion: string
): Promise<BundledNativeModules> {
  if (sdkVersion !== 'UNVERSIONED' && !APISettings.isOffline) {
    try {
      debug('Fetching bundled native modules from the server...');
      return await getNativeModuleVersionsAsync(sdkVersion);
    } catch {
      Log.warn(
        chalk`Unable to reach Expo servers. Falling back to using the cached dependency map ({bold bundledNativeModules.json}) from the package "{bold expo}" installed in your project.`
      );
    }
  }

  debug('Fetching bundled native modules from the local JSON file...');
  return await getBundledNativeModulesAsync(projectRoot);
}

/**
 * Get the legacy static `bundledNativeModules.json` file
 * that's shipped with the version of `expo` that the project has installed.
 */
async function getBundledNativeModulesAsync(projectRoot: string): Promise<BundledNativeModules> {
  // TODO: Revisit now that this code is in the `expo` package.
  const bundledNativeModulesPath = resolveFrom.silent(
    projectRoot,
    'expo/bundledNativeModules.json'
  );
  if (!bundledNativeModulesPath) {
    Log.log();
    throw new CommandError(
      chalk`The dependency map {bold expo/bundledNativeModules.json} cannot be found, please ensure you have the package "{bold expo}" installed in your project.`
    );
  }
  return await JsonFile.readAsync<BundledNativeModules>(bundledNativeModulesPath);
}
