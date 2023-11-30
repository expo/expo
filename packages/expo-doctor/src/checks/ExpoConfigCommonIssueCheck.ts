import JsonFile from '@expo/json-file';
import resolveFrom from 'resolve-from';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';

export class ExpoConfigCommonIssueCheck implements DoctorCheck {
  description = 'Check Expo config for common issues';

  sdkVersionRange = '*';

  async runAsync({ projectRoot, exp }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];
    let advice;

    // compare SDK version in package.json with installed expo package version
    // If these don't match, it almost certainly means the user specified expo.sdkVersion in their app.json/ app.config.js
    const expoSDKVersionFromPackageJson = getExpoSDKVersionFromPackage(projectRoot);

    if (expoSDKVersionFromPackageJson !== exp.sdkVersion) {
      issues.push(
        "It appears that expo.sdkVersion is defined in your app.json/ app.config.js. This can cause 'expo install' to install dependency versions for the wrong SDK. SDK version is determined by the version of the expo package installed in your project."
      );
      advice = 'Remove expo.sdkVersion from your app.json/ app.config.js.';
    }

    return {
      isSuccessful: issues.length === 0,
      issues,
      advice,
    };
  }
}

/**
 * Resolve the Expo SDK Version either from the input Expo config or from the installed
 * version of the `expo` package.
 * Adapted from https://github.com/expo/expo/blob/main/packages/%40expo/config/src/getExpoSDKVersion.ts
 */
function getExpoSDKVersionFromPackage(projectRoot: string): string | undefined {
  const packageJsonPath = resolveFrom.silent(projectRoot, 'expo/package.json');
  if (!packageJsonPath) {
    // (probably) technically impossible - if this happens, `getConfig` throws and Doctor crashes
    return undefined;
  }
  const expoPackageJson = JsonFile.read(packageJsonPath, { json5: true });
  const { version: packageVersion } = expoPackageJson;

  if (!(typeof packageVersion === 'string')) {
    // This is technically impossible.
    return undefined;
  }

  const majorVersion = packageVersion.split('.').shift();
  return `${majorVersion}.0.0`;
}
