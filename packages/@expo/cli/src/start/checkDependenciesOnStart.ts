import type { ExpoConfig, PackageJSONConfig } from '@expo/config';
import chalk from 'chalk';

import { getVersionedDependenciesAsync } from './doctor/dependencies/validateDependenciesVersions';
import * as Log from '../log';

/**
 * Check dependency versions and print a condensed summary for the start command.
 * Shows a specific hint for `expo` if out-of-range, and a one-line summary for all others.
 */
export async function checkDependenciesOnStartAsync(
  projectRoot: string,
  exp: Pick<ExpoConfig, 'sdkVersion'>,
  pkg: PackageJSONConfig
): Promise<void> {
  const incorrectDeps = await getVersionedDependenciesAsync(projectRoot, exp, pkg);
  const expoDep = incorrectDeps.find((dep) => dep.packageName === 'expo');
  const otherDeps = incorrectDeps.filter((dep) => dep.packageName !== 'expo');

  if (expoDep) {
    Log.warn(
      chalk`An update for {bold expo} is available: {red ${expoDep.actualVersion}} {dim →} {green ${expoDep.expectedVersionOrRange}}`
    );
  }
  if (otherDeps.length > 0) {
    Log.warn(
      chalk`${otherDeps.length} other package${otherDeps.length === 1 ? '' : 's'} should be updated. Run {bold npx expo install --check} for details.`
    );
  }
}
