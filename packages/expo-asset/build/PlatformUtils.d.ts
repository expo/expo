import Constants from 'expo-constants';
export declare const IS_ENV_WITH_LOCAL_ASSETS: boolean;
export declare function getLocalAssets(): Record<string, string>;
export declare function getManifest2(): typeof Constants.__unsafeNoWarnManifest2;
export declare const manifestBaseUrl: string | null;
/**
 * Downloads the asset from the given URL to a local cache and returns the local URL of the cached
 * file.
 *
 * If there is already a locally cached file and its MD5 hash matches the given `md5Hash` parameter,
 * if present, the remote asset is not downloaded. The `hash` property is included in Metro's asset
 * metadata objects when this module's `hashAssetFiles` plugin is used, which is the typical way the
 * `md5Hash` parameter of this function is provided.
 */
export declare function downloadAsync(url: string, md5Hash: string | null, type: string): Promise<string>;
//# sourceMappingURL=PlatformUtils.d.ts.map