import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import resolveFrom from 'resolve-from';

import * as Log from '../../log';
import { apiClient } from '../../utils/api';
import { CommandError } from '../../utils/errors';

interface NativeModule {
  npmPackage: string;
  versionRange: string;
}
type BundledNativeModuleList = NativeModule[];
export type BundledNativeModules = Record<string, string>;

/**
 * Gets the bundledNativeModules.json for a given SDK version:
 * - Tries to fetch the data from the /sdks/:sdkVersion/native-modules API endpoint.
 * - If the data is missing on the server (it can happen for SDKs that are yet fully released)
 *    or there's a downtime, reads the local .json file from the "expo" package.
 * - For UNVERSIONED, returns the local .json file contents.
 */
export async function getBundledNativeModulesAsync(
  projectRoot: string,
  sdkVersion: string
): Promise<BundledNativeModules> {
  if (sdkVersion === 'UNVERSIONED') {
    return await getBundledNativeModulesFromExpoPackageAsync(projectRoot);
  } else {
    try {
      return await getBundledNativeModulesFromApiAsync(sdkVersion);
    } catch {
      Log.warn(
        `Unable to reach Expo servers. Falling back to using the cached dependency map (${chalk.bold(
          'bundledNativeModules.json'
        )}) from the package "${chalk.bold`expo`}" installed in your project.`
      );
      return await getBundledNativeModulesFromExpoPackageAsync(projectRoot);
    }
  }
}

async function getBundledNativeModulesFromApiAsync(
  sdkVersion: string
): Promise<BundledNativeModules> {
  /**
   * The endpoint returns the list of bundled native modules for a given SDK version.
   * The data is populated by the `et sync-bundled-native-modules` script from expo/expo repo.
   * See the code for more details:
   * https://github.com/expo/expo/blob/master/tools/src/commands/SyncBundledNativeModules.ts
   *
   * Example result:
   * [
   *   {
   *     id: "79285187-e5c4-47f7-b6a9-664f5d16f0db",
   *     sdkVersion: "41.0.0",
   *     npmPackage: "expo-analytics-amplitude",
   *     versionRange: "~10.1.0",
   *     createdAt: "2021-04-29T09:34:32.825Z",
   *     updatedAt: "2021-04-29T09:34:32.825Z"
   *   },
   *   ...
   * ]
   */
  const { data } = await apiClient.get(`sdks/${sdkVersion}/native-modules`).json();

  if (!data.length) {
    throw new CommandError('VERSIONS', 'The bundled native module list from www is empty');
  }
  return fromBundledNativeModuleList(data);
}

/**
 * Get the legacy static `bundledNativeModules.json` file
 * that's shipped with the version of `expo` that the project has installed.
 */
async function getBundledNativeModulesFromExpoPackageAsync(
  projectRoot: string
): Promise<BundledNativeModules> {
  const bundledNativeModulesPath = resolveFrom.silent(
    projectRoot,
    'expo/bundledNativeModules.json'
  );
  if (!bundledNativeModulesPath) {
    Log.log();
    throw new CommandError(
      `The dependency map ${chalk.bold(
        `expo/bundledNativeModules.json`
      )} cannot be found, please ensure you have the package "${chalk.bold`expo`}" installed in your project.\n`
    );
  }
  return await JsonFile.readAsync<BundledNativeModules>(bundledNativeModulesPath);
}

function fromBundledNativeModuleList(list: BundledNativeModuleList): BundledNativeModules {
  return list.reduce((acc, i) => {
    acc[i.npmPackage] = i.versionRange;
    return acc;
  }, {} as BundledNativeModules);
}
