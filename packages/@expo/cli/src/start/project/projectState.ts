import { getPackageJson } from '@expo/config';
import resolveFrom from 'resolve-from';

import {
  hasRequiredAndroidFilesAsync,
  hasRequiredIOSFilesAsync,
} from '../../prebuild/clearNativeFolder';
import { findUnbundledNativeModulesAsync } from '../doctor/dependencies/validateDependenciesVersions';

const debug = require('debug')('expo:start:project:projectState') as typeof console.log;

/** The state of the project. */
export interface ProjectState {
  /** Whether the project has run `npx expo prebuild`. */
  customized: boolean;

  /** Whether the project is compatible with Expo Go. */
  expoGoCompatible: boolean;

  /** Whether the project has installed the expo-dev-client. */
  devClientInstalled: boolean;
}

/** Returns the `ProjectState` for the project. */
export async function getProjectStateAsync(projectRoot: string): Promise<ProjectState> {
  const [androidFilesExist, iosFilesExist, expoGoCompatible] = await Promise.all([
    hasRequiredAndroidFilesAsync(projectRoot),
    hasRequiredIOSFilesAsync(projectRoot),
    isExpoGoCompatibleAsync(projectRoot),
  ]);
  const result = {
    customized: androidFilesExist || iosFilesExist,
    expoGoCompatible,
    devClientInstalled: resolveFrom.silent(projectRoot, 'expo-dev-client') != null,
  };
  debug('getProjectStateAsync', result);
  return result;
}

/** Returns whether this project is compatible with Expo Go. */
export async function isExpoGoCompatibleAsync(projectRoot: string): Promise<boolean> {
  const pkg = getPackageJson(projectRoot);
  const unbundledNativeModules = await findUnbundledNativeModulesAsync(projectRoot, pkg);
  debug('UnbundledNativeModules', unbundledNativeModules);
  return unbundledNativeModules.length === 0;
}
