import assert from 'assert';
import resolveFrom from 'resolve-from';
import semver from 'semver';

export interface VersionInfo {
  expoPackageVersion: string;
  sdkVersion: string;
  iosDeploymentTarget: string;
  reactNativeVersionRange: string;
  androidAgpVersion?: string;
  supportCliIntegration?: boolean;
}

export const ExpoVersionMappings: VersionInfo[] = [
  // Please keep sdk versions in sorted order (latest sdk first)
  {
    expoPackageVersion: '~53.0.0',
    sdkVersion: '53.0.0',
    iosDeploymentTarget: '15.1',
    reactNativeVersionRange: '~0.79.0',
    supportCliIntegration: true,
  },
  {
    // react-native 0.78 support was serving through canary.
    // see: https://expo.dev/changelog/react-native-78
    expoPackageVersion: '53.0.0-canary-20250306-d9d3e02',
    sdkVersion: '52.0.0',
    iosDeploymentTarget: '15.1',
    reactNativeVersionRange: '~0.78.0',
    supportCliIntegration: true,
  },
  {
    expoPackageVersion: '~52.0.0',
    sdkVersion: '52.0.0',
    iosDeploymentTarget: '15.1',
    reactNativeVersionRange: '>= 0.76.0 < 0.78.0',
    supportCliIntegration: true,
  },
  {
    expoPackageVersion: '~51.0.0',
    sdkVersion: '51.0.0',
    iosDeploymentTarget: '13.4',
    reactNativeVersionRange: '>= 0.74.0',
    supportCliIntegration: true,
  },
  {
    expoPackageVersion: '~50.0.0',
    sdkVersion: '50.0.0',
    iosDeploymentTarget: '13.4',
    reactNativeVersionRange: '>= 0.73.0',
    supportCliIntegration: true,
  },
  {
    expoPackageVersion: '~49.0.0',
    sdkVersion: '49.0.0',
    iosDeploymentTarget: '13.0',
    reactNativeVersionRange: '>= 0.72.0',
    supportCliIntegration: true,
  },
  {
    expoPackageVersion: '~48.0.0',
    sdkVersion: '48.0.0',
    iosDeploymentTarget: '13.0',
    reactNativeVersionRange: '>= 0.71.0',
    androidAgpVersion: '7.4.1',
  },
  {
    expoPackageVersion: '~47.0.0',
    sdkVersion: '47.0.0',
    iosDeploymentTarget: '13.0',
    reactNativeVersionRange: '>= 0.70.0',
  },
  {
    expoPackageVersion: '~46.0.0',
    sdkVersion: '46.0.0',
    iosDeploymentTarget: '12.4',
    reactNativeVersionRange: '>= 0.69.0',
  },
  {
    expoPackageVersion: '~45.0.0',
    sdkVersion: '45.0.0',
    iosDeploymentTarget: '12.0',
    reactNativeVersionRange: '>= 0.65.0',
  },
  {
    expoPackageVersion: '~44.0.0',
    sdkVersion: '44.0.0',
    iosDeploymentTarget: '12.0',
    reactNativeVersionRange: '< 0.68.0',
  },
  {
    expoPackageVersion: '~43.0.0',
    sdkVersion: '43.0.0',
    iosDeploymentTarget: '12.0',
    reactNativeVersionRange: '< 0.68.0',
  },
];

export function getDefaultSdkVersion(projectRoot: string): VersionInfo {
  const reactNativePackageJsonPath = resolveFrom.silent(projectRoot, 'react-native/package.json');
  if (!reactNativePackageJsonPath) {
    throw new Error(`Unable to find react-native package - projectRoot[${projectRoot}]`);
  }
  const reactNativeVersion = require(reactNativePackageJsonPath).version;
  const versionInfo = ExpoVersionMappings.find((info) =>
    semver.satisfies(reactNativeVersion, info.reactNativeVersionRange)
  );
  if (!versionInfo) {
    throw new Error(
      `Unable to find compatible expo sdk version - reactNativeVersion[${reactNativeVersion}]`
    );
  }
  return versionInfo;
}

export function getLatestSdkVersion(): VersionInfo {
  const latestSdkVersion = ExpoVersionMappings.find(
    ({ expoPackageVersion }) => semver.prerelease(expoPackageVersion) == null
  );
  assert(latestSdkVersion, 'No latest SDK version found');
  return latestSdkVersion;
}

export function getVersionInfo(sdkVersion: string): VersionInfo | null {
  return ExpoVersionMappings.find((info) => info.sdkVersion === sdkVersion) ?? null;
}

export function getSdkVersion(reactNativeVersion: string): string {
  const versionInfo = ExpoVersionMappings.find((info) =>
    semver.satisfies(reactNativeVersion, info.reactNativeVersionRange)
  );
  assert(versionInfo, `Unsupported react-native version: ${reactNativeVersion}`);
  return versionInfo?.sdkVersion;
}
