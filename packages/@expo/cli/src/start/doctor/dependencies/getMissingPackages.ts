import JsonFile from '@expo/json-file';
import resolveFrom from 'resolve-from';
import semver from 'semver';

import { getCombinedKnownVersionsAsync } from './getVersionedPackages';

const debug = require('debug')('expo:doctor:dependencies:getMissingPackages') as typeof console.log;

export type ResolvedPackage = {
  /** Module ID pointing to the library `package.json`. */
  file: string;
  /** NPM package name. */
  pkg: string;
  /** Required version range. */
  version?: string;
  /** If the dependency should be installed as a `devDependency` */
  dev?: boolean;
};

/** Given a set of required packages, this method returns a list of missing packages. */
export function collectMissingPackages(
  projectRoot: string,
  requiredPackages: ResolvedPackage[]
): {
  missing: ResolvedPackage[];
  resolutions: Record<string, string>;
} {
  const resolutions: Record<string, string> = {};

  const missingPackages = requiredPackages.filter((p) => {
    const resolved = resolveFrom.silent(projectRoot, p.file);
    if (!resolved || !versionSatisfiesRequiredPackage(resolved, p)) {
      return true;
    }
    resolutions[p.pkg] = resolved;
    return false;
  });

  return { missing: missingPackages, resolutions };
}

export function versionSatisfiesRequiredPackage(
  packageJsonFilePath: string,
  resolvedPackage: Pick<ResolvedPackage, 'version' | 'pkg'>
): boolean {
  // If the version is specified, check that it satisfies the installed version.
  if (!resolvedPackage.version) {
    debug(`Required package "${resolvedPackage.pkg}" found (no version constraint specified).`);
    return true;
  }

  const pkgJson = JsonFile.read(packageJsonFilePath);
  if (
    // package.json has version.
    typeof pkgJson.version === 'string' &&
    // semver satisfaction.
    semver.satisfies(pkgJson.version, resolvedPackage.version)
  ) {
    return true;
  }
  debug(
    `Installed package "${resolvedPackage.pkg}" does not satisfy version constraint "${resolvedPackage.version}" (version: "${pkgJson.version}")`
  );
  return false;
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
    sdkVersion,
    requiredPackages,
  }: {
    sdkVersion?: string;
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
  await mutatePackagesWithKnownVersionsAsync(projectRoot, sdkVersion, results.missing);

  return results;
}

export async function mutatePackagesWithKnownVersionsAsync(
  projectRoot: string,
  sdkVersion: string | undefined,
  packages: ResolvedPackage[]
) {
  // Ensure the versions are right for the SDK that the project is currently using.
  const relatedPackages = await getCombinedKnownVersionsAsync({ projectRoot, sdkVersion });
  for (const pkg of packages) {
    if (
      // Only use the SDK versions if the package does not already have a hardcoded version.
      // We do this because some packages have API coded into the CLI which expects an exact version.
      !pkg.version &&
      pkg.pkg in relatedPackages
    ) {
      pkg.version = relatedPackages[pkg.pkg];
    }
  }
  return packages;
}
