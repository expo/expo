import { ExpoConfig } from '@expo/config';

export function getProjectProperties(projectRoot: string, exp: ExpoConfig) {
  return {
    sdkVersion: exp.sdkVersion ?? null,
  };
}
