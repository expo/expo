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
import { ProjectState } from '../start/project/projectState';
import { intersecting } from './array';

const debug = require('debug')('expo:utils:scheme') as typeof console.log;

type SchemeResolver = (schemes: string[]) => string[];

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
export async function getSchemesForIosAsync(
  projectRoot: string,
  resolver: SchemeResolver = resolveExpoOrLongestScheme
): Promise<string[]> {
  try {
    const infoPlistBuildProperty = getInfoPlistPathFromPbxproj(projectRoot);
    debug(`ios application Info.plist path:`, infoPlistBuildProperty);
    if (infoPlistBuildProperty) {
      const configPath = path.join(projectRoot, 'ios', infoPlistBuildProperty);
      const rawPlist = fs.readFileSync(configPath, 'utf8');
      const plistObject = plist.parse(rawPlist);
      const schemes = IOSConfig.Scheme.getSchemesFromPlist(plistObject);
      debug(`ios application schemes:`, schemes);
      return resolver(schemes);
    }
  } catch (error) {
    debug(`expected error collecting ios application schemes for the main target:`, error);
  }
  // No ios folder or some other error
  return [];
}

// TODO: Revisit and test after run code is merged.
export async function getSchemesForAndroidAsync(
  projectRoot: string,
  resolver: SchemeResolver = resolveExpoOrLongestScheme
): Promise<string[]> {
  try {
    const configPath = await AndroidConfig.Paths.getAndroidManifestAsync(projectRoot);
    const manifest = await AndroidConfig.Manifest.readAndroidManifestAsync(configPath);
    const schemes = await AndroidConfig.Scheme.getSchemesFromManifest(manifest);
    debug(`android application schemes:`, schemes);
    return resolver(schemes);
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

/**
 * Query the scheme for the project.
 */
export async function getSchemeAsync(
  projectRoot: string,
  projectState: ProjectState
): Promise<string | null> {
  const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true, skipPlugins: true });
  let configSchemes: string[];
  if (Array.isArray(exp.scheme)) {
    configSchemes = exp.scheme;
  } else if (exp.scheme != null) {
    configSchemes = [exp.scheme];
  } else {
    configSchemes = [];
  }

  if (!projectState.customized) {
    return configSchemes[0] ?? null;
  }

  // Custom scheme resolve which to use the intersected schemes from both expo config and native files.
  // That would increase the chance of using meaningful & user specified scheme.
  const nativeSchemesResolver = (schemes: string[]) => {
    let result = intersecting(configSchemes, schemes);
    if (result.length === 0) {
      // If there are no intersecting schemes, return all native schemes.
      result = schemes;
    }
    return result;
  };

  const [ios, android] = await Promise.all([
    getSchemesForIosAsync(projectRoot, nativeSchemesResolver),
    getSchemesForAndroidAsync(projectRoot, nativeSchemesResolver),
  ]);

  let matching: string;
  // Allow for only one native project to exist.
  if (ios.length === 0) {
    matching = android[0];
  } else if (android.length === 0) {
    matching = ios[0];
  } else {
    [matching] = intersecting(ios, android);
  }
  return matching ?? null;
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
