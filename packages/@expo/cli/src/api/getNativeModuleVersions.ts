import { createCachedFetch } from './rest/client';
import { CommandError } from '../utils/errors';

interface NativeModule {
  npmPackage: string;
  versionRange: string;
}
type BundledNativeModuleList = NativeModule[];

export type BundledNativeModules = Record<string, string>;

/**
 * The endpoint returns the list of bundled native modules for a given SDK version.
 * The data is populated by the `et sync-bundled-native-modules` script from expo/expo repo.
 * See the code for more details:
 * https://github.com/expo/expo/blob/main/tools/src/commands/SyncBundledNativeModules.ts
 *
 * Example result:
 * [
 *   {
 *     id: "79285187-e5c4-47f7-b6a9-664f5d16f0db",
 *     sdkVersion: "41.0.0",
 *     npmPackage: "expo-camera",
 *     versionRange: "~10.1.0",
 *     createdAt: "2021-04-29T09:34:32.825Z",
 *     updatedAt: "2021-04-29T09:34:32.825Z"
 *   },
 *   ...
 * ]
 */
export async function getNativeModuleVersionsAsync(
  sdkVersion: string
): Promise<BundledNativeModules> {
  const fetchAsync = createCachedFetch({
    cacheDirectory: 'native-modules-cache',
    // 1 minute cache
    ttl: 1000 * 60 * 1,
  });
  const results = await fetchAsync(`sdks/${sdkVersion}/native-modules`);
  if (!results.ok) {
    throw new CommandError(
      'API',
      `Unexpected response when fetching version info from Expo servers: ${results.statusText}.`
    );
  }
  const { data } = await results.json();
  if (!data.length) {
    throw new CommandError('VERSIONS', 'The bundled native module list from the Expo API is empty');
  }
  return fromBundledNativeModuleList(data);
}

function fromBundledNativeModuleList(list: BundledNativeModuleList): BundledNativeModules {
  return list.reduce((acc, i) => {
    acc[i.npmPackage] = i.versionRange;
    return acc;
  }, {} as BundledNativeModules);
}
