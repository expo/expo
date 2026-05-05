import type { ExpoConfig, PackageJSONConfig } from '@expo/config';
import chalk from 'chalk';

import * as Log from '../log';
import { getVersionedDependenciesAsync } from './doctor/dependencies/validateDependenciesVersions';

export type DependencyCheckResult = {
  expo?: { actualVersion: string; expectedVersionOrRange: string };
  otherCount: number;
};

/**
 * Fetch dependency version check results.
 * Returns null if everything is up-to-date.
 */
export async function checkDependenciesAsync(
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

/** Print the condensed dependency check messages to the terminal. */
export function printDependencyCheckResult(result: DependencyCheckResult): void {
  if (result.expo) {
    Log.warn(
      chalk`An update for {bold expo} is available: {red ${result.expo.actualVersion}} {dim →} {green ${result.expo.expectedVersionOrRange}}`
    );
  }
  if (result.otherCount > 0) {
    Log.warn(
      chalk`${result.otherCount} other package${result.otherCount === 1 ? '' : 's'} may need updating. Run {bold npx expo install --check} for details.`
    );
  }
}
