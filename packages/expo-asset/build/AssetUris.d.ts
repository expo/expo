export declare function getFilename(url: string): string;
export declare function getFileExtension(url: string): string;
/**
 * Returns the base URL from a manifest's URL. For example, given a manifest hosted at
 * https://example.com/app/manifest.json, the base URL would be https://example.com/app/. Query
 * parameters and fragments also are removed.
 *
 * For an Expo-hosted project with a manifest hosted at https://exp.host/@user/project/index.exp, the
 * base URL would be https://exp.host/@user/project.
 *
 * We also normalize the "exp" protocol to "http" to handle internal URLs with the Expo schemes used
 * to tell the OS to open the URLs in the the Expo client.
 */
export declare function getManifestBaseUrl(manifestUrl: string): string;
//# sourceMappingURL=AssetUris.d.ts.map