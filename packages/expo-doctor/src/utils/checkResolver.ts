import { ExpoConfig, PackageJSONConfig } from '@expo/config';
import semver from 'semver';

import { getCngCheckStatus, getReactNativeDirectoryCheckEnabled } from './doctorConfig';
import { env } from './env';
import { Log } from './log';
import { InstalledDependencyVersionCheck } from '../checks/InstalledDependencyVersionCheck';
import { ReactNativeDirectoryCheck } from '../checks/ReactNativeDirectoryCheck';
import { DOCTOR_CHECKS, DoctorCheck } from '../checks/checks.types';

/**
 * Resolves the checks that should be run for a given project.
 * @param exp - The Expo config.
 * @param pkg - The package.json config.
 * @returns The checks that should be run.
 */
export function resolveChecksInScope(exp: ExpoConfig, pkg: PackageJSONConfig): DoctorCheck[] {
  const resolvedChecks = [...DOCTOR_CHECKS];
  const isCngCheckEnabled = getCngCheckStatus(pkg);

  if (getReactNativeDirectoryCheckEnabled(exp, pkg)) {
    Log.log(
      'Enabled experimental React Native Directory checks. Unset the EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK environment variable to disable this check.'
    );
    resolvedChecks.push(new ReactNativeDirectoryCheck());
  }

  if (!env.EXPO_DOCTOR_SKIP_DEPENDENCY_VERSION_CHECK) {
    resolvedChecks.push(new InstalledDependencyVersionCheck());
  } else {
    Log.log(
      'Checking dependencies for compatibility with the installed Expo SDK version is disabled. Unset the EXPO_DOCTOR_SKIP_DEPENDENCY_VERSION_CHECK environment variable to re-enable this check.'
    );
  }

  if (!isCngCheckEnabled) {
    resolvedChecks.splice(
      resolvedChecks.findIndex(
        (check) => check.constructor.name === 'AppConfigFieldsNotSyncedToNativeProjectsCheck'
      ),
      1
    );

    Log.warn(
      `CNG check is disabled. You can re-enable it by setting 'cngCheckEnabled' to true in package.json.`
    );
  }

  return resolvedChecks.filter(
    (check) =>
      exp.sdkVersion === 'UNVERSIONED' || semver.satisfies(exp.sdkVersion!, check.sdkVersionRange)
  );
}
