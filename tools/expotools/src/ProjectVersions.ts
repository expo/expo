import path from 'path';
import fs from 'fs-extra';
import plist from 'plist';
import semver from 'semver';
import JsonFile from '@expo/json-file';

import * as Directories from './Directories';

interface ProjectVersions {
  sdkVersion: string;
  nativeSdkVersion: string;
  iosAppVersion: string;
}

const EXPO_DIR = Directories.getExpoRepositoryRootDir();

export async function sdkVersionAsync(): Promise<string> {
  const packageJson = await JsonFile.readAsync(path.join(EXPO_DIR, 'packages/expo/package.json'));
  return packageJson.version as string;
}

export async function nativeSdkVersionAsync(sdkVersion?: string): Promise<string> {
  // On the native side we always just the first release version (with zeros).
  const majorVersion = semver.major(sdkVersion || await sdkVersionAsync());
  return `${majorVersion}.0.0`;
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

export async function getProjectVersionsAsync(): Promise<ProjectVersions> {
  const sdkVersion = await sdkVersionAsync();
  const nativeSdkVersion = await nativeSdkVersionAsync(sdkVersion);
  const iosAppVersion = await iosAppVersionAsync();

  return {
    sdkVersion,
    nativeSdkVersion,
    iosAppVersion,
  };
}
