import JsonFile from '@expo/json-file';
import plist from '@expo/plist';
import fs from 'fs-extra';
import path from 'path';
import semver from 'semver';

import {
  EXPO_DIR,
  EXPO_GO_ANDROID_DIR,
  EXPO_GO_DIR,
  EXPO_GO_IOS_DIR,
  PACKAGES_DIR,
} from './Constants';

export type Platform = 'ios' | 'android';

type SDKVersionsObject = {
  sdkVersion: string;
};

const BUNDLED_NATIVE_MODULES_PATH = path.join(PACKAGES_DIR, 'expo', 'bundledNativeModules.json');

export async function sdkVersionAsync(): Promise<string> {
  const packageJson = await JsonFile.readAsync(path.join(EXPO_DIR, 'packages/expo/package.json'));
  return packageJson.version as string;
}

/**
 * Returns a major version number of the `expo` package.
 */
export async function sdkVersionNumberAsync(): Promise<number> {
  return semver.major(await sdkVersionAsync());
}

export async function iosAppVersionAsync(): Promise<string> {
  const infoPlistPath = path.join(EXPO_GO_IOS_DIR, 'Exponent', 'Supporting', 'Info.plist');
  const infoPlist = plist.parse(fs.readFileSync(infoPlistPath, 'utf8'));
  const bundleVersion = infoPlist.CFBundleShortVersionString;

  if (!bundleVersion) {
    throw new Error(`"CFBundleShortVersionString" not found in plist: ${infoPlistPath}`);
  }
  return bundleVersion;
}

export async function androidAppVersionAsync(): Promise<string> {
  const buildGradlePath = path.join(EXPO_GO_ANDROID_DIR, 'app', 'build.gradle');
  const buildGradleContent = await fs.readFile(buildGradlePath, 'utf8');
  const match = buildGradleContent.match(/versionName ['"]([^'"]+?)['"]/);

  if (!match) {
    throw new Error("Can't obtain `versionName` from app's build.gradle");
  }
  return match[1];
}

export async function getSDKVersionAsync(_platform?: Platform): Promise<string> {
  const sdkVersionsPath = path.join(EXPO_GO_DIR, 'sdkVersions.json');

  if (!(await fs.pathExists(sdkVersionsPath))) {
    throw new Error(`File at path "${sdkVersionsPath}" not found.`);
  }
  const { sdkVersion } = (await JsonFile.readAsync(sdkVersionsPath)) as SDKVersionsObject;
  return sdkVersion;
}

export async function getSDKVersionsAsync(platform: Platform): Promise<string[]> {
  return [await getSDKVersionAsync(platform)];
}

export async function getOldestSDKVersionAsync(platform: Platform): Promise<string> {
  return await getSDKVersionAsync(platform);
}

export async function getNewestSDKVersionAsync(platform: Platform): Promise<string> {
  return await getSDKVersionAsync(platform);
}

export async function getNextSDKVersionAsync(platform: Platform): Promise<string> {
  const currentVersion = await getSDKVersionAsync(platform);
  return `${semver.major(semver.inc(currentVersion, 'major')!)}.0.0`;
}

/**
 * Resolves given SDK number or tag to appropriate version.
 */
export async function resolveSDKVersionAsync(
  sdkVersion: string,
  platform: Platform
): Promise<string> {
  if (sdkVersion === 'latest' || sdkVersion === 'oldest') {
    return await getSDKVersionAsync(platform);
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
