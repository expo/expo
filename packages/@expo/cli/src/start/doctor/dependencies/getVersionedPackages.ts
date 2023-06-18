import { PackageJSONConfig } from '@expo/config';
import npmPackageArg from 'npm-package-arg';

import { getVersionsAsync, SDKVersion } from '../../../api/getVersions';
import { disableNetwork } from '../../../api/settings';
import { Log } from '../../../log';
import { env } from '../../../utils/env';
import { CommandError } from '../../../utils/errors';
import { getVersionedNativeModulesAsync } from './bundledNativeModules';

const debug = require('debug')(
  'expo:doctor:dependencies:getVersionedPackages'
) as typeof console.log;

export type DependencyList = Record<string, string>;

/** Adds `react-dom`, `react`, and `react-native` to the list of known package versions (`relatedPackages`) */
function normalizeSdkVersionObject(version?: SDKVersion): Record<string, string> {
  if (!version) {
    return {};
  }
  const { relatedPackages, facebookReactVersion, facebookReactNativeVersion } = version;

  const reactVersion = facebookReactVersion
    ? {
        react: facebookReactVersion,
        'react-dom': facebookReactVersion,
      }
    : undefined;

  return {
    ...relatedPackages,
    ...reactVersion,
    'react-native': facebookReactNativeVersion,
  };
}

/** Get the known versions for a given SDK, combines all sources. */
export async function getCombinedKnownVersionsAsync({
  projectRoot,
  sdkVersion,
  skipCache,
}: {
  projectRoot: string;
  sdkVersion?: string;
  skipCache?: boolean;
}) {
  const bundledNativeModules = sdkVersion
    ? await getVersionedNativeModulesAsync(projectRoot, sdkVersion)
    : {};
  const versionsForSdk = await getRemoteVersionsForSdkAsync({ sdkVersion, skipCache });
  return {
    ...versionsForSdk,
    ...bundledNativeModules,
  };
}

/** @returns a key/value list of known dependencies and their version (including range). */
export async function getRemoteVersionsForSdkAsync({
  sdkVersion,
  skipCache,
}: { sdkVersion?: string; skipCache?: boolean } = {}): Promise<DependencyList> {
  if (env.EXPO_OFFLINE) {
    Log.warn('Dependency validation is unreliable in offline-mode');
    return {};
  }

  try {
    const { sdkVersions } = await getVersionsAsync({ skipCache });

    // We only want versioned dependencies so skip if they cannot be found.
    if (!sdkVersion || !(sdkVersion in sdkVersions)) {
      debug(
        `Skipping versioned dependencies because the SDK version is not found. (sdkVersion: ${sdkVersion}, available: ${Object.keys(
          sdkVersions
        ).join(', ')})`
      );
      return {};
    }

    const version = sdkVersions[sdkVersion as keyof typeof sdkVersions] as unknown as SDKVersion;

    return normalizeSdkVersionObject(version);
  } catch (error: any) {
    if (error instanceof CommandError && error.code === 'OFFLINE') {
      return getRemoteVersionsForSdkAsync({ sdkVersion, skipCache });
    }
    throw error;
  }
}

/**
 * Versions a list of `packages` against a given `sdkVersion` based on local and remote versioning resources.
 *
 * @param projectRoot
 * @param param1
 * @returns
 */
export async function getVersionedPackagesAsync(
  projectRoot: string,
  {
    packages,
    sdkVersion,
    pkg,
  }: {
    /** List of npm packages to process. */
    packages: string[];
    /** Target SDK Version number to version the `packages` for. */
    sdkVersion: string;
    pkg: PackageJSONConfig;
  }
): Promise<{
  packages: string[];
  messages: string[];
  excludedNativeModules: { name: string; bundledNativeVersion: string }[];
}> {
  const versionsForSdk = await getCombinedKnownVersionsAsync({
    projectRoot,
    sdkVersion,
    skipCache: true,
  });

  let nativeModulesCount = 0;
  let othersCount = 0;
  const excludedNativeModules: { name: string; bundledNativeVersion: string }[] = [];

  const versionedPackages = packages.map((arg) => {
    const { name, type, raw } = npmPackageArg(arg);

    if (['tag', 'version', 'range'].includes(type) && name && versionsForSdk[name]) {
      // Unimodule packages from npm registry are modified to use the bundled version.
      // Some packages have the recommended version listed in https://exp.host/--/api/v2/versions.
      if (pkg?.expo?.install?.exclude?.includes(name)) {
        othersCount++;
        excludedNativeModules.push({ name, bundledNativeVersion: versionsForSdk[name] });
        return raw;
      }
      nativeModulesCount++;
      return `${name}@${versionsForSdk[name]}`;
    } else {
      // Other packages are passed through unmodified.
      othersCount++;
      return raw;
    }
  });

  const messages = getOperationLog({
    othersCount,
    nativeModulesCount,
    sdkVersion,
  });

  return {
    packages: versionedPackages,
    messages,
    excludedNativeModules,
  };
}

/** Craft a set of messages regarding the install operations. */
export function getOperationLog({
  nativeModulesCount,
  sdkVersion,
  othersCount,
}: {
  nativeModulesCount: number;
  othersCount: number;
  sdkVersion: string;
}): string[] {
  return [
    nativeModulesCount > 0 &&
      `${nativeModulesCount} SDK ${sdkVersion} compatible native ${
        nativeModulesCount === 1 ? 'module' : 'modules'
      }`,
    othersCount > 0 && `${othersCount} other ${othersCount === 1 ? 'package' : 'packages'}`,
  ].filter(Boolean) as string[];
}
