import path from 'path';
import fs from 'fs-extra';
import plist from 'plist';
import semver from 'semver';
import JsonFile from '@expo/json-file';

import * as Directories from './Directories';

export type Platform = 'ios' | 'android';

export type SDKVersionsObject = {
  sdkVersions: string[];
}

const EXPO_DIR = Directories.getExpoRepositoryRootDir();

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

export async function getHomeSDKVersionAsync(): Promise<string> {
  const homeAppJsonPath = path.join(EXPO_DIR, 'home', 'app.json');
  const appJson = await JsonFile.readAsync(homeAppJsonPath, { json5: true }) as any;

  if (appJson && appJson.expo && appJson.expo.sdkVersion) {
    return appJson.expo.sdkVersion as string;
  }
  throw new Error(`Home's SDK version not found!`);
}

export async function getSDKVersionsAsync(platform: Platform): Promise<string[]> {
  const sdkVersionsPath = path.join(EXPO_DIR, platform === 'ios' ? 'ios/Exponent/Supporting' : 'android', 'sdkVersions.json');

  if (!await fs.exists(sdkVersionsPath)) {
    throw new Error(`File at path "${sdkVersionsPath}" not found.`);
  }
  const { sdkVersions } = await JsonFile.readAsync(sdkVersionsPath) as SDKVersionsObject;
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
  return `${semver.major(semver.inc(newestVersion, 'major'))}.0.0`;
}
