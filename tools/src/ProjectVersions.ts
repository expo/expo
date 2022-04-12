import JsonFile from '@expo/json-file';
import fs from 'fs-extra';
import path from 'path';
import plist from 'plist';
import semver from 'semver';

import { EXPO_DIR, ANDROID_DIR, PACKAGES_DIR } from './Constants';

export type Platform = 'ios' | 'android';

export type SDKVersionsObject = {
  sdkVersions: string[];
};

const BUNDLED_NATIVE_MODULES_PATH = path.join(PACKAGES_DIR, 'expo', 'bundledNativeModules.json');

export async function sdkVersionAsync(): Promise<string> {
  const packageJson = await JsonFile.readAsync(path.join(EXPO_DIR, 'packages/expo/package.json'));
  return packageJson.version as string;
}

export async function iosAppVersionAsync(): Promise<string> {
  const infoPlistPath = path.join(EXPO_DIR, 'ios', 'Exponent', 'Supporting', 'Info.plist');
  const infoPlist = plist.parse(fs.readFileSync(infoPlistPath, 'utf8'));
  const bundleVersion = infoPlist.CFBundleShortVersionString;

  if (!bundleVersion) {
    throw new Error(`"CFBundleShortVersionString" not found in plist: ${infoPlistPath}`);
  }
  return bundleVersion;
}

export async function androidAppVersionAsync(): Promise<string> {
  const buildGradlePath = path.join(ANDROID_DIR, 'app', 'build.gradle');
  const buildGradleContent = await fs.readFile(buildGradlePath, 'utf8');
  const match = buildGradleContent.match(/versionName ['"]([^'"]+?)['"]/);

  if (!match) {
    throw new Error("Can't obtain `versionName` from app's build.gradle");
  }
  return match[1];
}

export async function getHomeSDKVersionAsync(): Promise<string> {
  const homeAppJsonPath = path.join(EXPO_DIR, 'home', 'app.json');
  const appJson = (await JsonFile.readAsync(homeAppJsonPath, { json5: true })) as any;

  if (appJson?.expo?.sdkVersion) {
    return appJson.expo.sdkVersion as string;
  }
  throw new Error(`Home's SDK version not found!`);
}

export async function getSDKVersionsAsync(platform: Platform): Promise<string[]> {
  const sdkVersionsPath = path.join(
    EXPO_DIR,
    platform === 'ios' ? 'ios/Exponent/Supporting' : 'android',
    'sdkVersions.json'
  );

  if (!(await fs.pathExists(sdkVersionsPath))) {
    throw new Error(`File at path "${sdkVersionsPath}" not found.`);
  }
  const { sdkVersions } = (await JsonFile.readAsync(sdkVersionsPath)) as SDKVersionsObject;
  return sdkVersions;
}

export async function getOldestSDKVersionAsync(platform: Platform): Promise<string | undefined> {
  const sdkVersions = await getSDKVersionsAsync(platform);
  return sdkVersions.sort(semver.compare)[0];
}

export async function getNewestSDKVersionAsync(platform: Platform): Promise<string | undefined> {
  const sdkVersions = await getSDKVersionsAsync(platform);
  return sdkVersions.sort(semver.rcompare)[0];
}

export async function getNextSDKVersionAsync(platform: Platform): Promise<string | undefined> {
  const newestVersion = await getNewestSDKVersionAsync(platform);

  if (!newestVersion) {
    return;
  }
  return `${semver.major(semver.inc(newestVersion, 'major')!)}.0.0`;
}

/**
 * Resolves given SDK number or tag to appropriate version.
 */
export async function resolveSDKVersionAsync(
  sdkVersion: string,
  platform: Platform
): Promise<string | undefined> {
  if (sdkVersion === 'latest') {
    return await getNewestSDKVersionAsync(platform);
  }
  if (sdkVersion === 'oldest') {
    return await getOldestSDKVersionAsync(platform);
  }
  if (sdkVersion === 'next') {
    return await getNextSDKVersionAsync(platform);
  }
  if (/^\d+$/.test(sdkVersion)) {
    return `${sdkVersion}.0.0`;
  }
  return sdkVersion;
}

/**
 * Returns an object with versions of bundled native modules.
 */
export async function getBundledVersionsAsync(): Promise<Record<string, string>> {
  return require(BUNDLED_NATIVE_MODULES_PATH) as Record<string, string>;
}

/**
 * Updates bundled native modules versions.
 */
export async function updateBundledVersionsAsync(patch: Record<string, string>): Promise<void> {
  await JsonFile.mergeAsync(BUNDLED_NATIVE_MODULES_PATH, patch);
}
