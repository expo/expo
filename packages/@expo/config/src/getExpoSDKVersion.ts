import JsonFile from '@expo/json-file';
import resolveFrom from 'resolve-from';

import { ExpoConfig } from './Config.types';
import { ConfigError } from './Errors';

/**
 * Resolve the Expo SDK Version either from the input Expo config or from the installed
 * version of the `expo` package.
 */
export function getExpoSDKVersion(
  projectRoot: string,
  exp: Pick<ExpoConfig, 'sdkVersion'> = {}
): string {
  return exp?.sdkVersion ?? getExpoSDKVersionFromPackage(projectRoot);
}

/**
 * Resolve the Expo SDK Version either from the input Expo config or from the installed
 * version of the `expo` package.
 */
function getExpoSDKVersionFromPackage(projectRoot: string): string {
  const packageJsonPath = resolveFrom.silent(projectRoot, 'expo/package.json');
  if (!packageJsonPath) {
    throw new ConfigError(
      `Cannot determine which native SDK version your project uses because the module \`expo\` is not installed. Please install it with \`yarn add expo\` and try again.`,
      'MODULE_NOT_FOUND'
    );
  }
  const expoPackageJson = JsonFile.read(packageJsonPath, { json5: true });
  const { version: packageVersion } = expoPackageJson;

  if (!(typeof packageVersion === 'string')) {
    // This is technically impossible.
    throw new ConfigError(
      `Cannot determine which native SDK version your project uses because the module \`expo\` has an invalid package.json (missing \`version\` field). Try reinstalling node modules and trying again.`,
      'MODULE_NOT_FOUND'
    );
  }

  const majorVersion = packageVersion.split('.').shift();
  return `${majorVersion}.0.0`;
}
