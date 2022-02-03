import { Config, Versions } from '@expo/xdl';

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
  return await runWithApiHost(apiHost, () => Versions.versionsAsync() as Promise<VersionsSchema>);
}

export async function getSdkVersionsAsync(
  sdkVersion: string,
  apiHost: VersionsApiHost = VersionsApiHost.STAGING
): Promise<VersionsSdkSchema | null> {
  const versions = await getVersionsAsync(apiHost);
  return versions?.sdkVersions?.[sdkVersion] ?? null;
}

export async function setVersionsAsync(
  versions: VersionsSchema,
  apiHost: VersionsApiHost = VersionsApiHost.STAGING
): Promise<void> {
  return await runWithApiHost(apiHost, () => Versions.setVersionsAsync(versions));
}

export async function modifySdkVersionsAsync(
  sdkVersion: string,
  modifier: (sdkVersions: VersionsSdkSchema) => VersionsSdkSchema | Promise<VersionsSdkSchema>
): Promise<VersionsSdkSchema> {
  const versions = await getVersionsAsync();
  const sdkVersions = await modifier(versions.sdkVersions[sdkVersion] ?? {});

  versions.sdkVersions[sdkVersion] = sdkVersions;
  await setVersionsAsync(versions);
  return sdkVersions;
}

async function runWithApiHost<T = any>(
  apiHost: VersionsApiHost,
  lambda: () => T | Promise<T>
): Promise<T> {
  const originalHost = Config.api.host;
  Config.api.host = apiHost;
  const result = await lambda();
  Config.api.host = originalHost;
  return result;
}
