import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { getDeepDependenciesWarningAsync } from '../utils/explainDependencies';
import { getRemoteVersionsForSdkAsync } from '../utils/getRemoteVersionsForSdkAsync';

export class SupportPackageVersionCheck implements DoctorCheck {
  description =
    'Check that native modules use compatible support package versions for installed Expo SDK';

  sdkVersionRange = '>=45.0.0';

  async runAsync({ exp, pkg, projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];

    const versionsForSdk = await getRemoteVersionsForSdkAsync(exp.sdkVersion);

    // only check for packages that have a required semver for the current SDK version
    // ADDING TO THIS LIST? Be sure to update "Release Workflow.md".
    // The release workflow also has instructions for updating the package versions, so you can test your change with the EXPO_STAGING=1 env var.
    const supportPackagesToValidate = [
      'expo-modules-autolinking',
      '@expo/config-plugins',
      '@expo/prebuild-config',
      '@expo/metro-config',
      'metro-config',
    ].filter((pkg) => versionsForSdk[pkg]);

    // check that a specific semver is installed for each package
    const possibleWarnings = await Promise.all(
      supportPackagesToValidate.map((pkg) =>
        getDeepDependenciesWarningAsync({ name: pkg, version: versionsForSdk[pkg] }, projectRoot)
      )
    );

    possibleWarnings.forEach((possibleWarning) => {
      if (possibleWarning) {
        issues.push(possibleWarning);
      }
    });

    const atLeastOneSupportPackagePinnedByResolution =
      possibleWarnings &&
      supportPackagesToValidate.find((packageName) => !!pkg.resolutions?.[packageName]);

    return {
      isSuccessful: issues.length === 0,
      issues,
      advice: issues.length
        ? 'Upgrade dependencies that are using the invalid package versions' +
          (atLeastOneSupportPackagePinnedByResolution &&
            ' or remove any resolutions from package.json that are pinning these packages to an invalid version') +
          '.'
        : undefined,
    };
  }
}
