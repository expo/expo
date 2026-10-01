import JsonFile from '@expo/json-file';
import path from 'node:path';

import { EXPO_DIR, LOCAL_API_HOST } from '../Constants';
import * as Versions from '../Versions';

export type NativeModulesEnv = 'local' | 'staging' | 'production';
export type BundledNativeModules = Record<string, string>;
export type NativeModuleChange = { npmPackage: string; from: string | null; to: string | null };

type NativeModuleList = { npmPackage: string; versionRange: string }[];

export async function readBundledNativeModulesAsync(
  root: string = EXPO_DIR
): Promise<BundledNativeModules> {
  return await JsonFile.readAsync<BundledNativeModules>(
    path.join(root, 'packages/expo/bundledNativeModules.json')
  );
}

export async function getNativeModulesAsync(
  env: NativeModulesEnv,
  sdkVersion: string
): Promise<BundledNativeModules> {
  const response = await fetch(`${resolveBaseApiUrl(env)}/v2/sdks/${sdkVersion}/native-modules`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch the native modules for SDK ${sdkVersion} from ${env}: ${await response.text()}`
    );
  }
  const { data } = (await response.json()) as { data: NativeModuleList };
  return Object.fromEntries(data.map((module) => [module.npmPackage, module.versionRange]));
}

export function diffNativeModules(
  current: BundledNativeModules,
  next: BundledNativeModules
): NativeModuleChange[] {
  const names = [...new Set([...Object.keys(next), ...Object.keys(current)])];
  return names
    .map((npmPackage) => ({
      npmPackage,
      from: current[npmPackage] ?? null,
      to: next[npmPackage] ?? null,
    }))
    .filter((change) => change.from !== change.to);
}

export async function putNativeModulesAsync(
  env: NativeModulesEnv,
  sdkVersion: string,
  modules: BundledNativeModules,
  secret: string
): Promise<void> {
  const nativeModules = Object.entries(modules).map(([npmPackage, versionRange]) => ({
    npmPackage,
    versionRange,
  }));
  const response = await fetch(
    `${resolveBaseApiUrl(env)}/v2/sdks/${sdkVersion}/native-modules/sync`,
    {
      method: 'put',
      body: JSON.stringify({ nativeModules }),
      headers: {
        'Content-Type': 'application/json',
        'expo-sdk-native-modules-secret': secret,
      },
    }
  );
  if (response.status !== 200) {
    throw new Error(
      `Failed to sync the native modules for SDK ${sdkVersion} to ${env}: ${await response.text()}`
    );
  }
}

export async function syncBundledNativeModulesAsync({
  env,
  sdkVersion,
  secret,
  bundledNativeModules,
}: {
  env: NativeModulesEnv;
  sdkVersion: string;
  secret: string;
  bundledNativeModules: BundledNativeModules;
}): Promise<NativeModuleChange[]> {
  const current = await getNativeModulesAsync(env, sdkVersion);
  const changes = diffNativeModules(current, bundledNativeModules);
  if (changes.length) {
    await putNativeModulesAsync(env, sdkVersion, bundledNativeModules, secret);
  }
  return changes;
}

export type NativeModulesSyncResult = {
  env: NativeModulesEnv;
  status: 'synced' | 'unchanged' | 'failed';
  changes: NativeModuleChange[];
  error?: string;
};

export async function syncNativeModulesEndpointsAsync({
  sdkVersion,
  secret,
  bundledNativeModules,
}: {
  sdkVersion: string;
  secret: string | undefined;
  bundledNativeModules: BundledNativeModules;
}): Promise<NativeModulesSyncResult[]> {
  const results: NativeModulesSyncResult[] = [];
  for (const env of ['staging', 'production'] as const) {
    if (!secret) {
      results.push({
        env,
        status: 'failed',
        changes: [],
        error: 'EXPO_SDK_NATIVE_MODULES_SECRET is not set',
      });
      continue;
    }
    try {
      const changes = await syncBundledNativeModulesAsync({
        env,
        sdkVersion,
        secret,
        bundledNativeModules,
      });
      results.push({ env, status: changes.length ? 'synced' : 'unchanged', changes });
    } catch (error) {
      results.push({
        env,
        status: 'failed',
        changes: [],
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return results;
}

function resolveBaseApiUrl(env: NativeModulesEnv): string {
  if (env === 'production') {
    return `https://${Versions.VersionsApiHost.PRODUCTION}`;
  } else if (env === 'staging') {
    return `https://${Versions.VersionsApiHost.STAGING}`;
  } else {
    return `http://${LOCAL_API_HOST}`;
  }
}
