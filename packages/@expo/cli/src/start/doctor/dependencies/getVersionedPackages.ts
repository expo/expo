import npmPackageArg from 'npm-package-arg';

import { getReleasedVersionsAsync, SDKVersion } from '../../../api/getVersions';
import * as Log from '../../../log';
import { getBundledNativeModulesAsync } from './bundledNativeModules';

export type DependencyList = Record<string, string>;

export async function getRemoteVersionsForSdkAsync(sdkVersion?: string): Promise<DependencyList> {
  const { sdkVersions } = await getReleasedVersionsAsync({ skipCache: true });

  // We only want versioned dependencies so skip if they cannot be found.
  if (!sdkVersion || !(sdkVersion in sdkVersions)) {
    Log.debug(
      `Skipping versioned dependencies because the SDK version is not found. (sdkVersion: ${sdkVersion}, available: ${Object.keys(
        sdkVersions
      ).join(', ')})`
    );
    return {};
  }

  const version = sdkVersions[sdkVersion as keyof typeof sdkVersions] as unknown as SDKVersion;

  if (!version) {
    return {};
  }

  const { relatedPackages, facebookReactVersion, facebookReactNativeVersion } =
    version as SDKVersion;

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
  }: {
    /** List of npm packages to process. */
    packages: string[];
    /** Target SDK Version number to version the `packages` for. */
    sdkVersion: string;
  }
): Promise<{ packages: string[]; messages: string[] }> {
  const bundledNativeModules = await getBundledNativeModulesAsync(projectRoot, sdkVersion);
  const versionsForSdk = await getRemoteVersionsForSdkAsync(sdkVersion);

  let nativeModulesCount = 0;
  let othersCount = 0;

  const versionedPackages = packages.map((arg) => {
    const { name, type, raw } = npmPackageArg(arg);

    if (['tag', 'version', 'range'].includes(type) && name && bundledNativeModules[name]) {
      // Unimodule packages from npm registry are modified to use the bundled version.
      nativeModulesCount++;
      return `${name}@${bundledNativeModules[name]}`;
    } else if (name && versionsForSdk[name]) {
      // Some packages have the recommended version listed in https://exp.host/--/api/v2/versions.
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
