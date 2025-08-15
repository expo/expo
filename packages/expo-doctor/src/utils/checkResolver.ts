import { ExpoConfig, PackageJSONConfig } from '@expo/config';
import semver from 'semver';

import {
  getAppConfigFieldsNotSyncedCheckStatus,
  getReactNativeDirectoryCheckEnabled,
} from './doctorConfig';
import { env } from './env';
import { Log } from './log';
import { AppConfigFieldsNotSyncedToNativeProjectsCheck } from '../checks/AppConfigFieldsNotSyncedToNativeProjectsCheck';
import { AutolinkingDependencyDuplicatesCheck } from '../checks/AutolinkingDependencyDuplicatesCheck';
import { DirectPackageInstallCheck } from '../checks/DirectPackageInstallCheck';
import { ExpoConfigCommonIssueCheck } from '../checks/ExpoConfigCommonIssueCheck';
import { ExpoConfigSchemaCheck } from '../checks/ExpoConfigSchemaCheck';
import { GlobalPackageInstalledLocallyCheck } from '../checks/GlobalPackageInstalledLocallyCheck';
import { IllegalPackageCheck } from '../checks/IllegalPackageCheck';
import { InstalledDependencyVersionCheck } from '../checks/InstalledDependencyVersionCheck';
import { MetroConfigCheck } from '../checks/MetroConfigCheck';
import { NativeToolingVersionCheck } from '../checks/NativeToolingVersionCheck';
import { PackageJsonCheck } from '../checks/PackageJsonCheck';
import { PackageManagerVersionCheck } from '../checks/PackageManagerVersionCheck';
import { PeerDependencyChecks } from '../checks/PeerDependencyChecks';
import { ProjectSetupCheck } from '../checks/ProjectSetupCheck';
import { ReactNativeDirectoryCheck } from '../checks/ReactNativeDirectoryCheck';
import { StoreCompatibilityCheck } from '../checks/StoreCompatibilityCheck';
import { SupportPackageVersionCheck } from '../checks/SupportPackageVersionCheck';
import { DoctorCheck } from '../checks/checks.types';

/**
 * Resolves the checks that should be run for a given project.
 * @param exp - The Expo config.
 * @param pkg - The package.json config.
 * @returns The checks that should be run.
 */
export function resolveChecksInScope(exp: ExpoConfig, pkg: PackageJSONConfig): DoctorCheck[] {
  // Standard checks
  const resolvedChecks: DoctorCheck[] = [
    // Project Structure Checks
    new ProjectSetupCheck(),
    new PackageJsonCheck(),
    new ExpoConfigSchemaCheck(),
    new ExpoConfigCommonIssueCheck(),
    new MetroConfigCheck(),

    // Package Management Checks
    new PackageManagerVersionCheck(),
    new IllegalPackageCheck(),
    new GlobalPackageInstalledLocallyCheck(),
    new DirectPackageInstallCheck(),
    new PeerDependencyChecks(),
    new AutolinkingDependencyDuplicatesCheck(),

    // Version Checks
    new SupportPackageVersionCheck(),
    new NativeToolingVersionCheck(),

    // Compatibility Checks
    new StoreCompatibilityCheck(),
    new AppConfigFieldsNotSyncedToNativeProjectsCheck(),
  ];

  const isAppConfigFieldsNotSyncedCheckEnabled = getAppConfigFieldsNotSyncedCheckStatus(pkg);

  if (getReactNativeDirectoryCheckEnabled(exp, pkg)) {
    resolvedChecks.push(new ReactNativeDirectoryCheck());
  }

  if (!env.EXPO_DOCTOR_SKIP_DEPENDENCY_VERSION_CHECK) {
    resolvedChecks.push(new InstalledDependencyVersionCheck());
  } else {
    Log.log(
      'Checking dependencies for compatibility with the installed Expo SDK version is disabled. Unset the EXPO_DOCTOR_SKIP_DEPENDENCY_VERSION_CHECK environment variable to re-enable this check.'
    );
  }

  if (!isAppConfigFieldsNotSyncedCheckEnabled) {
    resolvedChecks.splice(
      resolvedChecks.findIndex(
        (check) => check.constructor.name === 'AppConfigFieldsNotSyncedToNativeProjectsCheck'
      ),
      1
    );

    Log.log(
      'The appConfigFieldsNotSyncedCheck is disabled. Set expo.doctor.appConfigFieldsNotSyncedCheck.enabled to true in package.json to re-enable this check.'
    );
  }

  return resolvedChecks.filter(
    (check) =>
      exp.sdkVersion === 'UNVERSIONED' || semver.satisfies(exp.sdkVersion!, check.sdkVersionRange)
  );
}
