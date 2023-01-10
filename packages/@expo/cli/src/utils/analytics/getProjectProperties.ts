import { ExpoConfig } from '@expo/config';
import { resolvePackageManager } from '@expo/package-manager';

export function getProjectProperties(projectRoot: string, exp: ExpoConfig) {
  return {
    sdkVersion: exp.sdkVersion ?? null,
    packageManager: resolvePackageManager(projectRoot),
  };
}
