import resolveFrom from 'resolve-from';
import semver from 'semver';

export interface VersionInfo {
  expoSdkVersion: string;
  iosDeploymentTarget: string;
  reactNativeVersionRange: string;
  androidAgpVersion?: string;
  supportCliIntegration?: boolean;
}

export const ExpoVersionMappings: VersionInfo[] = [
  // Please keep sdk versions in sorted order (latest sdk first)
  {
    expoSdkVersion: '49.0.0',
    iosDeploymentTarget: '13.0',
    reactNativeVersionRange: '>= 0.72.0',
    supportCliIntegration: true,
  },
  {
    expoSdkVersion: '48.0.0',
    iosDeploymentTarget: '13.0',
    reactNativeVersionRange: '>= 0.71.0',
    androidAgpVersion: '7.4.1',
  },
  {
    expoSdkVersion: '47.0.0',
    iosDeploymentTarget: '13.0',
    reactNativeVersionRange: '>= 0.70.0',
  },
  {
    expoSdkVersion: '46.0.0',
    iosDeploymentTarget: '12.4',
    reactNativeVersionRange: '>= 0.69.0',
  },
  {
    expoSdkVersion: '45.0.0',
    iosDeploymentTarget: '12.0',
    reactNativeVersionRange: '>= 0.65.0',
  },
  {
    expoSdkVersion: '44.0.0',
    iosDeploymentTarget: '12.0',
    reactNativeVersionRange: '< 0.68.0',
  },
  {
    expoSdkVersion: '43.0.0',
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
  const versionInfo = ExpoVersionMappings.find(info =>
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
  return ExpoVersionMappings[0];
}

export function getVersionInfo(sdkVersion: string): VersionInfo | null {
  return ExpoVersionMappings.find(info => info.expoSdkVersion === sdkVersion) ?? null;
}
