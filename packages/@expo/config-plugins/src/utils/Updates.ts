import { Android, ExpoConfig, IOS } from '@expo/config-types';
import * as Fingerprint from '@expo/fingerprint';
import { getRuntimeVersionForSDKVersion } from '@expo/sdk-runtime-versions';
import fs from 'fs';
import { boolish } from 'getenv';
import path from 'path';
import resolveFrom from 'resolve-from';
import semver from 'semver';

import { AndroidConfig, IOSConfig } from '..';

export type ExpoConfigUpdates = Pick<
  ExpoConfig,
  'sdkVersion' | 'owner' | 'runtimeVersion' | 'updates' | 'slug'
>;

export function getExpoUpdatesPackageVersion(projectRoot: string): string | null {
  const expoUpdatesPackageJsonPath = resolveFrom.silent(projectRoot, 'expo-updates/package.json');
  if (!expoUpdatesPackageJsonPath || !fs.existsSync(expoUpdatesPackageJsonPath)) {
    return null;
  }
  const packageJson = JSON.parse(fs.readFileSync(expoUpdatesPackageJsonPath, 'utf8'));
  return packageJson.version;
}

export function getUpdateUrl(config: Pick<ExpoConfigUpdates, 'updates'>): string | null {
  return config.updates?.url ?? null;
}

export function getAppVersion(config: Pick<ExpoConfig, 'version'>): string {
  return config.version ?? '1.0.0';
}

export function getNativeVersion(
  config: Pick<ExpoConfig, 'version'> & {
    android?: Pick<Android, 'versionCode'>;
    ios?: Pick<IOS, 'buildNumber'>;
  },
  platform: 'android' | 'ios'
): string {
  const version = IOSConfig.Version.getVersion(config);
  switch (platform) {
    case 'ios': {
      const buildNumber = IOSConfig.Version.getBuildNumber(config);
      return `${version}(${buildNumber})`;
    }
    case 'android': {
      const versionCode = AndroidConfig.Version.getVersionCode(config);
      return `${version}(${versionCode})`;
    }
    default: {
      throw new Error(
        `"${platform}" is not a supported platform. Choose either "ios" or "android".`
      );
    }
  }
}

export async function getRuntimeVersionNullableAsync(
  ...[projectRoot, config, platform]: Parameters<typeof getRuntimeVersionAsync>
): Promise<string | null> {
  try {
    return await getRuntimeVersionAsync(projectRoot, config, platform);
  } catch (e) {
    if (boolish('EXPO_DEBUG', false)) {
      console.log(e);
    }
    return null;
  }
}

export async function getRuntimeVersionAsync(
  projectRoot: string,
  config: Pick<ExpoConfig, 'version' | 'runtimeVersion' | 'sdkVersion'> & {
    android?: Pick<Android, 'versionCode' | 'runtimeVersion'>;
    ios?: Pick<IOS, 'buildNumber' | 'runtimeVersion'>;
  },
  platform: 'android' | 'ios'
): Promise<string | null> {
  const runtimeVersion = config[platform]?.runtimeVersion ?? config.runtimeVersion;
  if (!runtimeVersion) {
    return null;
  }

  if (typeof runtimeVersion === 'string') {
    return runtimeVersion;
  } else if (runtimeVersion.policy === 'appVersion') {
    return getAppVersion(config);
  } else if (runtimeVersion.policy === 'nativeVersion') {
    return getNativeVersion(config, platform);
  } else if (runtimeVersion.policy === 'sdkVersion') {
    if (!config.sdkVersion) {
      throw new Error("An SDK version must be defined when using the 'sdkVersion' runtime policy.");
    }
    return getRuntimeVersionForSDKVersion(config.sdkVersion);
  } else if (runtimeVersion.policy === 'fingerprintExperimental') {
    console.warn(
      "Use of the experimental 'fingerprintExperimental' runtime policy may result in unexpected system behavior."
    );
    return await Fingerprint.createProjectHashAsync(projectRoot);
  }

  throw new Error(
    `"${
      typeof runtimeVersion === 'object' ? JSON.stringify(runtimeVersion) : runtimeVersion
    }" is not a valid runtime version. getRuntimeVersionAsync only supports a string, "sdkVersion", "appVersion", "nativeVersion" or "fingerprintExperimental" policy.`
  );
}

export function getSDKVersion(config: Pick<ExpoConfigUpdates, 'sdkVersion'>): string | null {
  return typeof config.sdkVersion === 'string' ? config.sdkVersion : null;
}

export function getUpdatesEnabled(config: Pick<ExpoConfigUpdates, 'updates'>): boolean {
  // allow override of enabled property
  if (config.updates?.enabled !== undefined) {
    return config.updates.enabled;
  }

  return getUpdateUrl(config) !== null;
}

export function getUpdatesTimeout(config: Pick<ExpoConfigUpdates, 'updates'>): number {
  return config.updates?.fallbackToCacheTimeout ?? 0;
}

export function getUpdatesCheckOnLaunch(
  config: Pick<ExpoConfigUpdates, 'updates'>,
  expoUpdatesPackageVersion?: string | null
): 'NEVER' | 'ERROR_RECOVERY_ONLY' | 'ALWAYS' | 'WIFI_ONLY' {
  if (config.updates?.checkAutomatically === 'ON_ERROR_RECOVERY') {
    // native 'ERROR_RECOVERY_ONLY' option was only introduced in 0.11.x
    if (expoUpdatesPackageVersion && semver.gte(expoUpdatesPackageVersion, '0.11.0')) {
      return 'ERROR_RECOVERY_ONLY';
    }
    return 'NEVER';
  } else if (config.updates?.checkAutomatically === 'ON_LOAD') {
    return 'ALWAYS';
  } else if (config.updates?.checkAutomatically === 'WIFI_ONLY') {
    return 'WIFI_ONLY';
  } else if (config.updates?.checkAutomatically === 'NEVER') {
    return 'NEVER';
  }
  return 'ALWAYS';
}

export function getUpdatesCodeSigningCertificate(
  projectRoot: string,
  config: Pick<ExpoConfigUpdates, 'updates'>
): string | undefined {
  const codeSigningCertificatePath = config.updates?.codeSigningCertificate;
  if (!codeSigningCertificatePath) {
    return undefined;
  }

  const finalPath = path.join(projectRoot, codeSigningCertificatePath);
  if (!fs.existsSync(finalPath)) {
    throw new Error(`File not found at \`updates.codeSigningCertificate\` path: ${finalPath}`);
  }

  return fs.readFileSync(finalPath, 'utf8');
}

export function getUpdatesCodeSigningMetadata(
  config: Pick<ExpoConfigUpdates, 'updates'>
): NonNullable<ExpoConfigUpdates['updates']>['codeSigningMetadata'] {
  return config.updates?.codeSigningMetadata;
}

export function getUpdatesCodeSigningMetadataStringified(
  config: Pick<ExpoConfigUpdates, 'updates'>
): string | undefined {
  const metadata = getUpdatesCodeSigningMetadata(config);
  if (!metadata) {
    return undefined;
  }

  return JSON.stringify(metadata);
}

export function getUpdatesRequestHeaders(
  config: Pick<ExpoConfigUpdates, 'updates'>
): NonNullable<ExpoConfigUpdates['updates']>['requestHeaders'] {
  return config.updates?.requestHeaders;
}

export function getUpdatesRequestHeadersStringified(
  config: Pick<ExpoConfigUpdates, 'updates'>
): string | undefined {
  const metadata = getUpdatesRequestHeaders(config);
  if (!metadata) {
    return undefined;
  }

  return JSON.stringify(metadata);
}
