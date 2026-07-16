import { getConfig } from '@expo/config';
import { AndroidConfig, IOSConfig } from '@expo/config-plugins';
import { getInfoPlistPathFromPbxproj } from '@expo/config-plugins/build/ios/utils/getInfoPlistPath';
import plist from '@expo/plist';
import fs from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';

import * as Log from '../log';
import {
  hasRequiredAndroidFilesAsync,
  hasRequiredIOSFilesAsync,
} from '../prebuild/clearNativeFolder';
import { intersecting } from './array';
import { event } from './events';

// sort longest to ensure uniqueness.
// this might be undesirable as it causes the QR code to be longer.
function sortLongest(obj: string[]): string[] {
  return obj.sort((a, b) => b.length - a.length);
}

/**
 * Resolve the scheme for the dev client using two methods:
 *   - filter on known Expo schemes, starting with `exp+`, avoiding 3rd party schemes.
 *   - filter on longest to ensure uniqueness.
 */
function resolveExpoOrLongestScheme(schemes: string[]): string[] {
  const expoOnlySchemes = schemes.filter((scheme) => scheme.startsWith('exp+'));
  return expoOnlySchemes.length > 0 ? sortLongest(expoOnlySchemes) : sortLongest(schemes);
}

// TODO: Revisit and test after run code is merged.
export async function getSchemesForIosAsync(projectRoot: string): Promise<string[]> {
  try {
    const infoPlistBuildProperty = getInfoPlistPathFromPbxproj(projectRoot);
    if (infoPlistBuildProperty) {
      event('scheme_ios_plist_path', { path: infoPlistBuildProperty });
      const configPath = path.join(projectRoot, 'ios', infoPlistBuildProperty);
      const rawPlist = fs.readFileSync(configPath, 'utf8');
      const plistObject = plist.parse(rawPlist);
      const schemes = IOSConfig.Scheme.getSchemesFromPlist(plistObject);
      event('scheme_ios_schemes', { schemes });
      return resolveExpoOrLongestScheme(schemes);
    }
  } catch (error) {
    event('scheme_ios_error', { error: event.error(error as Error) });
  }
  // No ios folder or some other error
  return [];
}

// TODO: Revisit and test after run code is merged.
export async function getSchemesForAndroidAsync(projectRoot: string): Promise<string[]> {
  try {
    const configPath = await AndroidConfig.Paths.getAndroidManifestAsync(projectRoot);
    const manifest = await AndroidConfig.Manifest.readAndroidManifestAsync(configPath);
    const schemes = await AndroidConfig.Scheme.getSchemesFromManifest(manifest);
    event('scheme_android_schemes', { schemes });
    return resolveExpoOrLongestScheme(schemes);
  } catch (error) {
    event('scheme_android_error', { error: event.error(error as Error) });
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
      '\nDevelopment build: Unable to determine the default URI scheme for deep linking into the app. Ensure that the expo-dev-client package is installed.'
    );
    return null;
  }
}

// TODO: Revisit and test after run code is merged.
export async function getOptionalDevClientSchemeAsync(
  projectRoot: string
): Promise<{ scheme: string | null; resolution: 'config' | 'shared' | 'android' | 'ios' }> {
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
    return { scheme: await getManagedDevClientSchemeAsync(projectRoot), resolution: 'config' };
  }

  // Allow for only one native project to exist.
  if (!hasIos) {
    return { scheme: android[0]!, resolution: 'android' };
  } else if (!hasAndroid) {
    return { scheme: ios[0]!, resolution: 'ios' };
  } else {
    return { scheme: intersecting(ios, android)[0]!, resolution: 'shared' };
  }
}
