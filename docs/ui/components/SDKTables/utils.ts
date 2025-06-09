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

  const endIndex = Math.min(sdkData.sdkVersions.length, currentIndex + 3);
  return sdkData.sdkVersions.slice(currentIndex, endIndex);
};

export const latestSdkVersionValues = sdkData.sdkVersions[0];
