import JsonFile from '@expo/json-file';
import resolveFrom from 'resolve-from';

import { ExpoConfig } from './Config.types';
import { ConfigError } from './Errors';

export function getExpoSDKVersion(
  projectRoot: string,
  exp: Pick<ExpoConfig, 'sdkVersion'>
): string {
  if (exp?.sdkVersion) {
    return exp.sdkVersion;
  }
  const packageJsonPath = resolveFrom.silent(projectRoot, 'expo/package.json');
  if (packageJsonPath) {
    const expoPackageJson = JsonFile.read(packageJsonPath, { json5: true });
    const { version: packageVersion } = expoPackageJson;
    if (typeof packageVersion === 'string') {
      const majorVersion = packageVersion.split('.').shift();
      return `${majorVersion}.0.0`;
    }
  }
  throw new ConfigError(
    `Cannot determine which native SDK version your project uses because the module \`expo\` is not installed. Please install it with \`yarn add expo\` and try again.`,
    'MODULE_NOT_FOUND'
  );
}
