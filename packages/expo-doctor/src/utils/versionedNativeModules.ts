import type { BundledNativeModules } from '@expo/cli/src/api/getNativeModuleVersions';
import { getVersionedNativeModulesAsync } from '@expo/cli/src/start/doctor/dependencies/bundledNativeModules';

import { Log } from '../utils/log';

let _getBundledNativeModules: Promise<BundledNativeModules | null> | undefined;

export async function getVersionedNativeModuleNamesAsync(
  projectRoot: string,
  expoSdkVersion: string
): Promise<string[] | null> {
  if (!_getBundledNativeModules) {
    _getBundledNativeModules = getVersionedNativeModulesAsync(projectRoot, expoSdkVersion).catch(
      () => {
        Log.error('Warning: Could not fetch bundled native modules');
        return null;
      }
    );
  }
  try {
    const bundledNativeModules = await _getBundledNativeModules;
    return bundledNativeModules ? Object.keys(bundledNativeModules) : null;
  } catch (error) {
    return null;
  }
}
