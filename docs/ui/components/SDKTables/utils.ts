import sdkCompatibilityData from '@expo/sdk-compatibility/data';
import type { SdkCompatibility } from '@expo/sdk-compatibility/types';

export type SdkVersionValues = {
  sdk: string;
  android: string;
  compileSdkVersion: string;
  targetSdkVersion: string;
  buildToolsVersion: string;
  ios: string;
  xcode: string;
  react: string;
  node: string;
} & Record<'react-native' | 'react-native-web' | 'react-native-tvos', string>;

const normalizeVersion = (version: string) => version.replace(/^v/, '');

const formatXcodeVersionRange = (range: string) => {
  const boundedRange = /^>=(\d+\.\d+)(?:\.0)? <=(\d+\.\d+)(?:\.0)?$/.exec(range);
  if (boundedRange) {
    return `${boundedRange[1]} - ${boundedRange[2]}`;
  }

  const minimumRange = /^>=(\d+\.\d+)(?:\.0)?$/.exec(range);
  return minimumRange ? `${minimumRange[1]}+` : range;
};

const formatNodeMinimumVersion = (version?: string) => {
  const minimumVersion = /^(\d+\.\d+)\.0$/.exec(version ?? '');
  return minimumVersion ? `${minimumVersion[1]}.x` : (version ?? '');
};

const toSdkVersionValues = (compatibility: SdkCompatibility): SdkVersionValues => ({
  sdk: compatibility.sdk,
  android: `${compatibility.android.minimumVersion}+`,
  compileSdkVersion: String(compatibility.android.compileSdkVersion),
  targetSdkVersion: compatibility.android.targetSdkVersion?.toString() ?? '',
  buildToolsVersion: compatibility.android.buildToolsVersion ?? '',
  ios: `${compatibility.ios.minimumVersion}+`,
  xcode: formatXcodeVersionRange(compatibility.ios.xcodeVersionRange),
  'react-native': compatibility.runtime.reactNative,
  'react-native-web': compatibility.runtime.reactNativeWeb,
  'react-native-tvos': compatibility.runtime.reactNativeTvos ?? '',
  react: compatibility.runtime.react ?? '',
  node: formatNodeMinimumVersion(compatibility.node?.minimumVersion),
});

export const sdkVersionValues = sdkCompatibilityData.sdkVersions.map(toSdkVersionValues);

export const getThreeVersions = (currentVersion: string) => {
  const normalizedVersion = normalizeVersion(currentVersion);
  const currentIndex = sdkVersionValues.findIndex(v => v.sdk === normalizedVersion);

  if (currentIndex === -1) {
    return [];
  }

  // NOTE(@kitten): This is a temporary exception for SDK 57, which keeps SDK 54 in range
  // as it was an "off-cycle" release
  const inRange = normalizedVersion === '57.0.0' ? 4 : 3;

  const endIndex = Math.min(sdkVersionValues.length, currentIndex + inRange);
  return sdkVersionValues.slice(currentIndex, endIndex);
};

export const latestSdkVersionValues = sdkVersionValues[0];
