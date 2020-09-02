import { Versions, Config } from '@expo/xdl';

export async function updateReactNativeUnimodulesAsync(
  expoDir: string,
  reactNativeUnimodulesVersion: string,
  sdkVersion: string
): Promise<void> {
  process.env.EXPO_STAGING = '1';
  Config.api.host = 'staging.exp.host';
  let versions = await Versions.versionsAsync();
  if (!versions.sdkVersions[sdkVersion]) {
    throw new Error(`SDK version ${sdkVersion} not found in versions JSON`);
  }

  if (!versions.sdkVersions[sdkVersion].packagesToInstallWhenEjecting) {
    versions.sdkVersions[sdkVersion].packagesToInstallWhenEjecting = {};
  }

  versions.sdkVersions[sdkVersion].packagesToInstallWhenEjecting![
    'react-native-unimodules'
  ] = reactNativeUnimodulesVersion;

  await Versions.setVersionsAsync(versions);
}
