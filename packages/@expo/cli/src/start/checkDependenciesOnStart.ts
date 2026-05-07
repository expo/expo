import type { ExpoConfig, PackageJSONConfig } from '@expo/config';
import chalk from 'chalk';

import * as Log from '../log';
import { getVersionedDependenciesAsync } from './doctor/dependencies/validateDependenciesVersions';

export interface DependencyCheckResult {
  expo?: { actualVersion: string; expectedVersionOrRange: string };
  otherCount: number;
}

export interface DependencyCheckRef {
  result: DependencyCheckResult | null;
  promise: Promise<DependencyCheckResult | null>;
}

/**
 * Fetch dependency version check results.
 * Returns null if everything is up-to-date.
 */
async function checkDependenciesAsync(
  projectRoot: string,
  exp: Pick<ExpoConfig, 'sdkVersion'>,
  pkg: PackageJSONConfig
): Promise<DependencyCheckResult | null> {
  const incorrectDeps = await getVersionedDependenciesAsync(projectRoot, exp, pkg);
  if (incorrectDeps.length === 0) {
    return null;
  }

  const expoDep = incorrectDeps.find((dep) => dep.packageName === 'expo');
  const otherCount = incorrectDeps.filter((dep) => dep.packageName !== 'expo').length;

  return {
    expo: expoDep
      ? {
          actualVersion: expoDep.actualVersion,
          expectedVersionOrRange: expoDep.expectedVersionOrRange,
        }
      : undefined,
    otherCount,
  };
}

let _checkDependenciesRef: DependencyCheckRef | undefined;

export function checkDependencies(
  projectRoot: string,
  exp: Pick<ExpoConfig, 'sdkVersion'>,
  pkg: PackageJSONConfig
) {
  if (_checkDependenciesRef) {
    return _checkDependenciesRef;
  }

  const ref: DependencyCheckRef = {
    result: null,
    promise: Promise.resolve(null),
  };

  ref.promise = checkDependenciesAsync(projectRoot, exp, pkg).then(
    (result) => {
      ref.result = result;
      return result;
    },
    (_error) => null
  );

  _checkDependenciesRef = ref;
  return ref;
}

/** Print the condensed dependency check messages to the terminal. */
export function getDependencyCheckMessage(
  result: DependencyCheckResult | null | undefined
): string[] {
  if (result?.expo) {
    return [
      chalk.yellow`An update for {bold expo} is available: {red ${result.expo.actualVersion}} {dim →} {green ${result.expo.expectedVersionOrRange}}`,
      chalk.yellow`${result.otherCount} other package${result.otherCount === 1 ? '' : 's'} may need updating. Run {bold npx expo install --check} for details.`,
    ];
  } else if (result?.otherCount) {
    return [
      chalk.yellow`${result.otherCount} package${result.otherCount === 1 ? '' : 's'} may need updating. Run {bold npx expo install --check} for details.`,
    ];
  } else {
    return [];
  }
}

/** Print the condensed dependency check messages to the terminal. */
export function printDependencyCheckResult(result: DependencyCheckResult): void {
  for (const line of getDependencyCheckMessage(result)) {
    Log.log(line);
  }
}
