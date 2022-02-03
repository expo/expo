import semver from 'semver';

import { Task } from '../../TasksRunner';
import { CommandOptions, Parcel, ReleaseType, TaskArgs } from '../types';
import { findUnpublished } from './findUnpublished';

const RELEASE_TYPES_ASC_ORDER = [ReleaseType.PATCH, ReleaseType.MINOR, ReleaseType.MAJOR];

/**
 * Resolves parcel's release type and version, based on its `minReleaseType` and its dependencies.
 */
export const resolveReleaseTypeAndVersion = new Task<TaskArgs>(
  {
    name: 'resolveReleaseTypeAndVersion',
    dependsOn: [findUnpublished],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    const prerelease = options.prerelease === true ? 'rc' : options.prerelease || undefined;

    for (const parcel of parcels) {
      const { pkg, pkgView, state } = parcel;

      // Find the highest release type among parcel's dependencies.
      const accumulatedTypes = recursivelyAccumulateReleaseTypes(parcel);
      const highestReleaseType = [...accumulatedTypes].reduce(
        highestReleaseTypeReducer,
        ReleaseType.PATCH
      );
      const allVersions = pkgView?.versions ?? [];

      // Make it a prerelease version if `--prerelease` was passed and assign to the state.
      state.releaseType = prerelease
        ? (('pre' + highestReleaseType) as ReleaseType)
        : highestReleaseType;

      // If the version to bump is not published yet, then we do want to use it instead,
      // no matter which release type is suggested.
      if (allVersions.includes(pkg.packageVersion)) {
        // Calculate version that we should bump to.
        state.releaseVersion = resolveSuggestedVersion(
          pkg.packageVersion,
          allVersions,
          state.releaseType,
          prerelease
        );
      } else {
        state.releaseVersion = pkg.packageVersion;
      }
    }
  }
);

/**
 * Returns suggested version based on given current version, already published versions and suggested release type.
 */
export function resolveSuggestedVersion(
  versionToBump: string,
  otherVersions: string[],
  releaseType: ReleaseType,
  prereleaseIdentifier?: string | null
): string {
  const targetPrereleaseIdentifier = prereleaseIdentifier ?? getPrereleaseIdentifier(versionToBump);

  // Higher version might have already been published from another place,
  // so get the highest published version that satisfies release type.
  const highestSatisfyingVersion = otherVersions
    .filter((version) => {
      return (
        semver.gt(version, versionToBump) &&
        semver.diff(version, versionToBump) === releaseType &&
        getPrereleaseIdentifier(version) === targetPrereleaseIdentifier
      );
    })
    .sort(semver.rcompare)[0];

  return semver.inc(
    highestSatisfyingVersion ?? versionToBump,
    releaseType,
    targetPrereleaseIdentifier ?? undefined
  ) as string;
}

/**
 * Accumulates all `minReleaseType` in given parcel and all its dependencies.
 */
function recursivelyAccumulateReleaseTypes(parcel: Parcel, set: Set<ReleaseType> = new Set()) {
  if (parcel.state.minReleaseType) {
    set.add(parcel.state.minReleaseType);
  }
  for (const dependency of parcel.dependencies) {
    recursivelyAccumulateReleaseTypes(dependency, set);
  }
  return set;
}

/**
 * Used as a reducer to find the highest release type.
 */
function highestReleaseTypeReducer(a: ReleaseType, b: ReleaseType): ReleaseType {
  const ai = RELEASE_TYPES_ASC_ORDER.indexOf(a);
  const bi = RELEASE_TYPES_ASC_ORDER.indexOf(b);
  return bi > ai ? b : a;
}

/**
 * Returns prerelease identifier of given version or `null` if given version is not a prerelease version.
 * `semver.prerelease` returns an array of prerelease parts (`1.0.0-beta.0` results in `['beta', 0]`),
 * however we just need the identifier.
 */
function getPrereleaseIdentifier(version: string): string | null {
  const prerelease = semver.prerelease(version);
  return Array.isArray(prerelease) && typeof prerelease[0] === 'string' ? prerelease[0] : null;
}
