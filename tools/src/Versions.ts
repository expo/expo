import { Config, Versions } from '@expo/xdl';

import logger from './Logger';

export enum VersionsApiHost {
  PRODUCTION = 'exp.host',
  STAGING = 'staging.exp.host',
}

export type VersionsSchema = {
  sdkVersions: Record<string, VersionsSdkSchema>;
  turtleSdkVersions: {
    android: string;
    ios: string;
  };
};

export type VersionsSdkSchema = Partial<{
  androidClientUrl: string;
  androidClientVersion: string;
  androidExpoViewUrl: string;
  expokitNpmPackage: string;
  expoReactNativeTag: string;
  facebookReactNativeVersion: string;
  facebookReactVersion: string;
  iosClientUrl: string;
  iosClientVersion: string;
  iosExpoViewUrl: string;
  packagesToInstallWhenEjecting: Record<string, string>;
  relatedPackages: Record<string, string>;
  releaseNoteUrl: string;
}>;

export async function getVersionsAsync(
  apiHost: VersionsApiHost = VersionsApiHost.STAGING
): Promise<VersionsSchema> {
  if (process.env.CI) {
    logger.info(`Getting versions from API host: ${apiHost}`);
  }
  const result = await runWithApiHost(
    apiHost,
    () => Versions.versionsAsync() as Promise<VersionsSchema>
  );
  if (process.env.CI) {
    logger.debug('Received versions:', JSON.stringify(result, null, 2));
  }
  return result;
}

export async function getSdkVersionsAsync(
  sdkVersion: string,
  apiHost: VersionsApiHost = VersionsApiHost.STAGING
): Promise<VersionsSdkSchema | null> {
  if (process.env.CI) {
    logger.info(`Getting SDK version ${sdkVersion} from API host: ${apiHost}`);
  }
  const versions = await getVersionsAsync(apiHost);
  const sdkVersions = versions?.sdkVersions?.[sdkVersion] ?? null;
  if (process.env.CI) {
    logger.debug(`SDK version ${sdkVersion} data:`, JSON.stringify(sdkVersions, null, 2));
  }
  return sdkVersions;
}

export async function setVersionsAsync(
  versions: VersionsSchema,
  apiHost: VersionsApiHost = VersionsApiHost.STAGING
): Promise<void> {
  if (process.env.CI) {
    logger.info(`Setting versions on API host: ${apiHost}`);
    logger.debug('Setting versions data:', JSON.stringify(versions, null, 2));
  }
  return await runWithApiHost(apiHost, () => Versions.setVersionsAsync(versions));
}

export async function modifyVersionsAsync(
  modifier: (versions: VersionsSchema) => VersionsSchema | Promise<VersionsSchema>
): Promise<VersionsSchema> {
  const versions = await getVersionsAsync();
  const modifiedVersions = await modifier(versions);
  await setVersionsAsync(modifiedVersions);
  return modifiedVersions;
}

export async function modifySdkVersionsAsync(
  sdkVersion: string,
  modifier: (sdkVersions: VersionsSdkSchema) => VersionsSdkSchema | Promise<VersionsSdkSchema>
): Promise<VersionsSdkSchema> {
  if (process.env.CI) {
    logger.info(`Modifying SDK version: ${sdkVersion}`);
  }
  const versions = await getVersionsAsync();
  if (process.env.CI) {
    logger.debug('Current versions before modification:', JSON.stringify(versions, null, 2));
  }

  const sdkVersions = await modifier(versions.sdkVersions[sdkVersion] ?? {});
  if (process.env.CI) {
    logger.debug('Modified SDK version data:', JSON.stringify(sdkVersions, null, 2));
  }

  versions.sdkVersions[sdkVersion] = sdkVersions;
  await setVersionsAsync(versions);
  if (process.env.CI) {
    logger.info(`Successfully modified and saved SDK version: ${sdkVersion}`);
  }
  return sdkVersions;
}

async function runWithApiHost<T = any>(
  apiHost: VersionsApiHost,
  lambda: () => T | Promise<T>
): Promise<T> {
  if (process.env.CI) {
    logger.debug(`Temporarily switching API host to: ${apiHost}`);
  }
  const originalHost = Config.api.host;
  Config.api.host = apiHost;
  const result = await lambda();
  Config.api.host = originalHost;
  if (process.env.CI) {
    logger.debug('Restored original API host:', originalHost);
  }
  return result;
}
