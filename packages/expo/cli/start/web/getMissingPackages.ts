import { ExpoConfig, getConfig } from '@expo/config';
import resolveFrom from 'resolve-from';

import * as Versions from '../api/Versions';

export type ResolvedPackage = {
  file: string;
  pkg: string;
  version?: string;
};

export function collectMissingPackages(
  projectRoot: string,
  requiredPackages: ResolvedPackage[]
): {
  missing: ResolvedPackage[];
  resolutions: Record<string, string>;
} {
  const resolutions: Record<string, string> = {};

  const missingPackages = requiredPackages.filter((p) => {
    try {
      const resolved = resolveFrom(projectRoot, p.file);
      if (resolved) {
        resolutions[p.pkg] = resolved;
      }
      return !resolved;
    } catch {
      return true;
    }
  });

  return { missing: missingPackages, resolutions };
}

/**
 * Collect missing packages given a list of required packages.
 * Any missing packages will be versioned to the known versions for the current SDK.
 *
 * @param projectRoot
 * @param props.requiredPackages list of required packages to check for
 * @returns list of missing packages and resolutions to existing packages.
 */
export async function getMissingPackagesAsync(
  projectRoot: string,
  {
    exp = getConfig(projectRoot, { skipSDKVersionRequirement: true }).exp,
    requiredPackages,
  }: {
    exp?: ExpoConfig;
    requiredPackages: ResolvedPackage[];
  }
): Promise<{
  missing: ResolvedPackage[];
  resolutions: Record<string, string>;
}> {
  const results = collectMissingPackages(projectRoot, requiredPackages);
  if (!results.missing.length) {
    return results;
  }

  // Ensure the versions are right for the SDK that the project is currently using.
  await mutatePackagesWithKnownVersionsAsync(exp, results.missing);

  return results;
}

async function getSDKVersionsAsync(exp: ExpoConfig): Promise<Versions.SDKVersion | null> {
  try {
    if (exp.sdkVersion) {
      const sdkVersions = await Versions.getReleasedVersionsAsync();
      return sdkVersions[exp.sdkVersion] ?? null;
    }
  } catch {
    // This is a convenience method and we should avoid making this halt the process.
  }
  return null;
}

export async function mutatePackagesWithKnownVersionsAsync(
  exp: ExpoConfig,
  packages: ResolvedPackage[]
) {
  // Ensure the versions are right for the SDK that the project is currently using.
  const versions = await getSDKVersionsAsync(exp);
  if (versions?.relatedPackages) {
    for (const pkg of packages) {
      if (pkg.pkg in versions.relatedPackages) {
        pkg.version = versions.relatedPackages[pkg.pkg];
      }
    }
  }
  return packages;
}
