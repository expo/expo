import { getConfig } from '@expo/config';
import { AndroidConfig, AppleConfig } from '@expo/config-plugins';
import { getInfoPlistPathFromPbxproj as getInfoPlistPathFromPbxprojIos } from '@expo/config-plugins/build/ios/utils/getInfoPlistPath';
import { getInfoPlistPathFromPbxproj as getInfoPlistPathFromPbxprojMacos } from '@expo/config-plugins/build/macos/utils/getInfoPlistPath';
import plist from '@expo/plist';
import fs from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';

import { intersecting } from './array';
import * as Log from '../log';
import {
  hasRequiredAndroidFilesAsync,
  hasRequiredAppleFilesAsync,
} from '../prebuild/clearNativeFolder';

const debug = require('debug')('expo:utils:scheme') as typeof console.log;

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
export const getSchemesForAppleAsync =
  (applePlatform: 'ios' | 'macos') =>
  async (projectRoot: string): Promise<string[]> => {
    try {
      const infoPlistBuildProperty =
        applePlatform === 'ios'
          ? getInfoPlistPathFromPbxprojIos(projectRoot)
          : getInfoPlistPathFromPbxprojMacos(projectRoot);
      debug(`${applePlatform} application Info.plist path:`, infoPlistBuildProperty);
      if (infoPlistBuildProperty) {
        const configPath = path.join(projectRoot, applePlatform, infoPlistBuildProperty);
        const rawPlist = fs.readFileSync(configPath, 'utf8');
        const plistObject = plist.parse(rawPlist);
        const schemes = AppleConfig.Scheme.getSchemesFromPlist(plistObject);
        debug(`${applePlatform} application schemes:`, schemes);
        return resolveExpoOrLongestScheme(schemes);
      }
    } catch (error) {
      debug(
        `expected error collecting ${applePlatform} application schemes for the main target:`,
        error
      );
    }
    // No ios/macos folder or some other error
    return [];
  };

export const getSchemesForIosAsync = getSchemesForAppleAsync('ios');
export const getSchemesForMacosAsync = getSchemesForAppleAsync('macos');

// TODO: Revisit and test after run code is merged.
export async function getSchemesForAndroidAsync(projectRoot: string): Promise<string[]> {
  try {
    const configPath = await AndroidConfig.Paths.getAndroidManifestAsync(projectRoot);
    const manifest = await AndroidConfig.Manifest.readAndroidManifestAsync(configPath);
    const schemes = await AndroidConfig.Scheme.getSchemesFromManifest(manifest);
    debug(`android application schemes:`, schemes);
    return resolveExpoOrLongestScheme(schemes);
  } catch (error) {
    debug(`expected error collecting android application schemes for the main activity:`, error);
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
export async function getOptionalDevClientSchemeAsync(projectRoot: string): Promise<{
  scheme: string | null;
  resolution: 'config' | 'shared' | 'android' | 'ios' | 'macos';
}> {
  const [hasIos, hasMacos, hasAndroid] = await Promise.all([
    hasRequiredAppleFilesAsync('ios')(projectRoot),
    hasRequiredAppleFilesAsync('macos')(projectRoot),
    hasRequiredAndroidFilesAsync(projectRoot),
  ]);

  const [ios, macos, android] = await Promise.all([
    getSchemesForAppleAsync('ios')(projectRoot),
    getSchemesForAppleAsync('macos')(projectRoot),
    getSchemesForAndroidAsync(projectRoot),
  ]);

  // Allow managed projects
  if (!hasIos && !hasMacos && !hasAndroid) {
    return { scheme: await getManagedDevClientSchemeAsync(projectRoot), resolution: 'config' };
  }

  // Allow for only one native project to exist.
  if (!hasIos && !hasMacos) {
    return { scheme: android[0], resolution: 'android' };
  } else if (!hasAndroid) {
    if (ios[0]) {
      return { scheme: ios[0], resolution: 'ios' };
    }
    return { scheme: macos[0], resolution: 'macos' };
  } else {
    return { scheme: intersecting([...ios, ...macos], android)[0], resolution: 'shared' };
  }
}
