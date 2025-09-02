import { getVersionedNativeModulesAsync } from '@expo/cli/src/start/doctor/dependencies/bundledNativeModules';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { getDeepDependenciesWarningWithPackageNameAsync } from '../utils/explainDependencies';

export class DeepNativeModuleVersionCheck implements DoctorCheck {
  description =
    'Check that deep dependencies versions for key modules against recommended versions';

  sdkVersionRange = '>=45.0.0';

  async runAsync({ exp, projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    let issues: string[] = [];

    // Specify which packages to validate
    const packagesToCheck = ['expo-modules-core'];

    // Fetch expected version ranges for native modules for the current SDK
    const nativeModuleVersions = await getVersionedNativeModulesAsync(projectRoot, exp.sdkVersion!);

    const packagesToValidate = packagesToCheck
      .filter((packageName) => nativeModuleVersions[packageName])
      .map((packageName) => ({ packageName, version: nativeModuleVersions[packageName] }));

    // check that a specific semver is installed for each package
    const warnings = (
      await Promise.all(
        packagesToValidate.map((p) =>
          getDeepDependenciesWarningWithPackageNameAsync(p.packageName, p.version, projectRoot)
        )
      )
    ).flatMap((r) => (r ? [r] : []));

    issues = warnings.map((r) => r.message);

    return {
      isSuccessful: issues.length === 0,
      issues,
      advice: issues.length
        ? [
            'Update packages so the resolved version matches the recommended range.',
            'If version ranges already allow a compatible version, regenerate the lockfile and reinstall dependencies to refresh the resolution.',
          ]
        : [],
    };
  }
}
