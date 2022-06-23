import { Android, ExpoConfig, IOS } from '@expo/config-types';
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

export function getUpdateUrl(
  config: Pick<ExpoConfigUpdates, 'owner' | 'slug' | 'updates'>,
  username: string | null
): string | null {
  if (config.updates?.url) {
    return config.updates?.url;
  }

  const user = typeof config.owner === 'string' ? config.owner : username;
  if (!user) {
    return null;
  }
  return `https://exp.host/@${user}/${config.slug}`;
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

/**
 * Compute runtime version policies.
 * @return an expoConfig with only string valued platform specific runtime versions.
 */
export const withRuntimeVersion: (config: ExpoConfig) => ExpoConfig = config => {
  if (config.ios?.runtimeVersion || config.runtimeVersion) {
    const runtimeVersion = getRuntimeVersion(config, 'ios');
    if (runtimeVersion) {
      config.ios = {
        ...config.ios,
        runtimeVersion,
      };
    }
  }
  if (config.android?.runtimeVersion || config.runtimeVersion) {
    const runtimeVersion = getRuntimeVersion(config, 'android');
    if (runtimeVersion) {
      config.android = {
        ...config.android,
        runtimeVersion,
      };
    }
  }
  delete config.runtimeVersion;
  return config;
};

export function getRuntimeVersionNullable(
  ...[config, platform]: Parameters<typeof getRuntimeVersion>
): string | null {
  try {
    return getRuntimeVersion(config, platform);
  } catch (e) {
    if (boolish('EXPO_DEBUG', false)) {
      console.log(e);
    }
    return null;
  }
}

export function getRuntimeVersion(
  config: Pick<ExpoConfig, 'version' | 'runtimeVersion' | 'sdkVersion'> & {
    android?: Pick<Android, 'versionCode' | 'runtimeVersion'>;
    ios?: Pick<IOS, 'buildNumber' | 'runtimeVersion'>;
  },
  platform: 'android' | 'ios'
): string | null {
  const runtimeVersion = config[platform]?.runtimeVersion ?? config.runtimeVersion;
  if (!runtimeVersion) {
    return null;
  }

  if (typeof runtimeVersion === 'string') {
    return runtimeVersion;
  } else if (runtimeVersion.policy === 'nativeVersion') {
    return getNativeVersion(config, platform);
  } else if (runtimeVersion.policy === 'sdkVersion') {
    if (!config.sdkVersion) {
      throw new Error("An SDK version must be defined when using the 'sdkVersion' runtime policy.");
    }
    return getRuntimeVersionForSDKVersion(config.sdkVersion);
  }

  throw new Error(
    `"${
      typeof runtimeVersion === 'object' ? JSON.stringify(runtimeVersion) : runtimeVersion
    }" is not a valid runtime version. getRuntimeVersion only supports a string, "sdkVersion", or "nativeVersion" policy.`
  );
}

export function getSDKVersion(config: Pick<ExpoConfigUpdates, 'sdkVersion'>): string | null {
  return typeof config.sdkVersion === 'string' ? config.sdkVersion : null;
}

export function getUpdatesEnabled(config: Pick<ExpoConfigUpdates, 'updates'>): boolean {
  return config.updates?.enabled !== false;
}

export function getUpdatesTimeout(config: Pick<ExpoConfigUpdates, 'updates'>): number {
  return config.updates?.fallbackToCacheTimeout ?? 0;
}

export function getUpdatesCheckOnLaunch(
  config: Pick<ExpoConfigUpdates, 'updates'>,
  expoUpdatesPackageVersion?: string | null
): 'NEVER' | 'ERROR_RECOVERY_ONLY' | 'ALWAYS' {
  if (config.updates?.checkAutomatically === 'ON_ERROR_RECOVERY') {
    // native 'ERROR_RECOVERY_ONLY' option was only introduced in 0.11.x
    if (expoUpdatesPackageVersion && semver.gte(expoUpdatesPackageVersion, '0.11.0')) {
      return 'ERROR_RECOVERY_ONLY';
    }
    return 'NEVER';
  } else if (config.updates?.checkAutomatically === 'ON_LOAD') {
    return 'ALWAYS';
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
