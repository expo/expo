import { getVersionedNativeModulesAsync } from '@expo/cli/src/start/doctor/dependencies/bundledNativeModules';

import { Log } from '../utils/log';

export interface VersionedNativeModuleNamesCache {
  nativeModuleNames?: Promise<string[] | null>;
}

export const getVersionedNativeModuleNamesAsync = (
  cache: VersionedNativeModuleNamesCache,
  params: {
    projectRoot: string;
    sdkVersion: string | undefined;
  }
): Promise<string[] | null> => {
  const _task = async () => {
    try {
      const bundledNativeModules = await getVersionedNativeModulesAsync(
        params.projectRoot,
        params.sdkVersion!
      );
      return bundledNativeModules ? Object.keys(bundledNativeModules) : null;
    } catch {
      Log.error('Warning: Could not fetch bundled native modules');
      return null;
    }
  };

  return cache.nativeModuleNames || (cache.nativeModuleNames = _task());
};
