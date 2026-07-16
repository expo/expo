import sdkData from './sdk-versions.json';

const normalizeVersion = (version: string) => version.replace(/^v/, '');

export const getThreeVersions = (currentVersion: string) => {
  const normalizedVersion = normalizeVersion(currentVersion);
  const currentIndex = sdkData.sdkVersions.findIndex(
    (v: { sdk: string }) => v.sdk === normalizedVersion
  );

  if (currentIndex === -1) {
    return [];
  }

  // NOTE(@kitten): This is a temporary exception for SDK 57, which keeps SDK 54 in range
  // as it was an "off-cycle" release
  const inRange = normalizedVersion === '57.0.0' ? 4 : 3;

  const endIndex = Math.min(sdkData.sdkVersions.length, currentIndex + inRange);
  return sdkData.sdkVersions.slice(currentIndex, endIndex);
};

export const latestSdkVersionValues = sdkData.sdkVersions[0];
