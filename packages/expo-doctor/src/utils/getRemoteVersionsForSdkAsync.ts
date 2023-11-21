// copied from https://github.com/expo/expo-cli/blob/d00319aae4fdcacf1a335af5a8428c45b62fc4d7/packages/expo-cli/src/utils/getRemoteVersionsForSdk.ts
// minor naming changes, replaced XDL version request with getVersionsAsync

import { getVersionsAsync } from '../api/getVersionsAsync';

export type DependencyList = Record<string, string>;

export const getRemoteVersionsForSdkAsync = async (
  sdkVersion?: string
): Promise<DependencyList> => {
  const { sdkVersions } = await getVersionsAsync();
  if (sdkVersion && sdkVersion in sdkVersions) {
    const { relatedPackages, facebookReactVersion, facebookReactNativeVersion } = sdkVersions[
      sdkVersion
    ];
    const reactVersion = facebookReactVersion
      ? {
          react: facebookReactVersion,
          'react-dom': facebookReactVersion,
        }
      : undefined;
    return {
      ...relatedPackages,
      ...reactVersion,
      'react-native': facebookReactNativeVersion,
    };
  }
  return {};
};
