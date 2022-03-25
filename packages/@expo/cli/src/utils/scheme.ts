import { getConfig } from '@expo/config';
import { AndroidConfig, IOSConfig } from '@expo/config-plugins';
import plist from '@expo/plist';
import fs from 'fs';
import resolveFrom from 'resolve-from';

import * as Log from '../log';
import {
  hasRequiredAndroidFilesAsync,
  hasRequiredIOSFilesAsync,
} from '../prebuild/clearNativeFolder';
import { intersecting } from './array';

// sort longest to ensure uniqueness.
// this might be undesirable as it causes the QR code to be longer.
function sortLongest(obj: string[]): string[] {
  return obj.sort((a, b) => b.length - a.length);
}

// TODO: Revisit and test after run code is merged.
export async function getSchemesForIosAsync(projectRoot: string) {
  try {
    const configPath = IOSConfig.Paths.getInfoPlistPath(projectRoot);
    const rawPlist = fs.readFileSync(configPath, 'utf8');
    const plistObject = plist.parse(rawPlist);
    return sortLongest(IOSConfig.Scheme.getSchemesFromPlist(plistObject));
  } catch {
    // No ios folder or some other error
    return [];
  }
}

// TODO: Revisit and test after run code is merged.
export async function getSchemesForAndroidAsync(projectRoot: string) {
  try {
    const configPath = await AndroidConfig.Paths.getAndroidManifestAsync(projectRoot);
    const manifest = await AndroidConfig.Manifest.readAndroidManifestAsync(configPath);
    return sortLongest(await AndroidConfig.Scheme.getSchemesFromManifest(manifest));
  } catch {
    // No android folder or some other error
    return [];
  }
}

// TODO: Revisit and test after run code is merged.
async function getManagedDevClientSchemeAsync(projectRoot: string): Promise<string | null> {
  const { exp } = getConfig(projectRoot);
  try {
    const getDefaultScheme = require(resolveFrom(projectRoot, 'expo-dev-client/getDefaultScheme'));
    const scheme = getDefaultScheme(exp);
    return scheme;
  } catch {
    Log.warn(
      '\nDevelopment build: Unable to get the default URI scheme for the project. Please make sure the expo-dev-client package is installed.'
    );
    return null;
  }
}

// TODO: Revisit and test after run code is merged.
export async function getOptionalDevClientSchemeAsync(projectRoot: string): Promise<string | null> {
  const [hasIos, hasAndroid] = await Promise.all([
    hasRequiredIOSFilesAsync(projectRoot),
    hasRequiredAndroidFilesAsync(projectRoot),
  ]);

  const [ios, android] = await Promise.all([
    getSchemesForIosAsync(projectRoot),
    getSchemesForAndroidAsync(projectRoot),
  ]);

  // Allow managed projects
  if (!hasIos && !hasAndroid) {
    return getManagedDevClientSchemeAsync(projectRoot);
  }

  let matching: string;
  // Allow for only one native project to exist.
  if (!hasIos) {
    matching = android[0];
  } else if (!hasAndroid) {
    matching = ios[0];
  } else {
    [matching] = intersecting(ios, android);
  }
  return matching ?? null;
}
