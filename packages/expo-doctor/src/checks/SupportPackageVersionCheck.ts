import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { getDeepDependenciesWarningAsync } from '../utils/explainDependencies';
import { getRemoteVersionsForSdkAsync } from '../utils/getRemoteVersionsForSdkAsync';
import { joinWithCommasAnd } from '../utils/strings';

async function getDeepDependenciesWarningWithPackageNameAsync(
  packageName: string,
  version: string,
  projectRoot: string
): Promise<{ packageName: string; message: string } | null> {
  const maybeWarning = await getDeepDependenciesWarningAsync(
    { name: packageName, version },
    projectRoot
  );
  if (maybeWarning) {
    return { packageName, message: maybeWarning };
  }
  return null;
}

export class SupportPackageVersionCheck implements DoctorCheck {
  description =
    'Check that native modules use compatible support package versions for installed Expo SDK';

  sdkVersionRange = '>=45.0.0 <54.0.0';

  async runAsync({ exp, pkg, projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    let issues: string[] = [];

    const versionsForSdk = await getRemoteVersionsForSdkAsync(exp.sdkVersion);

    // only check for packages that have a required semver for the current SDK version
    // ADDING TO THIS LIST? Be sure to update "Release Workflow.md".
    // The release workflow also has instructions for updating the package versions, so you can test your change with the EXPO_STAGING=1 env var.
    const supportPackagesToValidate = [
      'expo-modules-autolinking',
      '@expo/config-plugins',
      '@expo/prebuild-config',
      '@expo/metro-config',
      'metro',
    ]
      .filter((packageName) => versionsForSdk[packageName])
      .map((packageName) => ({ packageName, version: versionsForSdk[packageName] }));

    // if metro is present in versions API, add check additional key metro packages, which should use some version
    if (supportPackagesToValidate.find((p) => p.packageName === 'metro')) {
      supportPackagesToValidate.push(
        { packageName: 'metro-resolver', version: versionsForSdk['metro'] },
        { packageName: 'metro-config', version: versionsForSdk['metro'] }
      );
    }

    // check that a specific semver is installed for each package
    const warnings = (
      await Promise.all(
        supportPackagesToValidate.map((p) =>
          getDeepDependenciesWarningWithPackageNameAsync(p.packageName, p.version, projectRoot)
        )
      )
    ).flatMap((r) => (r ? [r] : []));

    issues = warnings.map((r) => r.message);

    const supportPackagesPinnedByResolution = warnings
      .filter((warning) => !!pkg.resolutions?.[warning.packageName])
      .map((warning) => warning.packageName);

    return {
      isSuccessful: issues.length === 0,
      issues,
      advice: issues.length
        ? [
            'Upgrade dependencies that are using the invalid package versions' +
              (supportPackagesPinnedByResolution.length
                ? ` and remove resolutions from package.json that are pinning ${joinWithCommasAnd(
                    supportPackagesPinnedByResolution
                  )} to an invalid version`
                : '') +
              '.',
          ]
        : [],
    };
  }
}
