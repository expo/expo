import { ExpoConfig } from '@expo/config';
import fs from 'fs/promises';
import path from 'path';

import { getAssetSchemasAsync } from '../../../api/getExpoSchema';
import { BundleAssetWithFileHashes } from '../../../export/fork-bundleAsync';
import * as Log from '../../../log';
import { fileExistsAsync } from '../../../utils/dir';
import { CommandError } from '../../../utils/errors';
import { get, set } from '../../../utils/obj';
import { validateUrl } from '../../../utils/url';

type ManifestAsset = { fileHashes: string[]; files: string[]; hash: string };

export type Asset = ManifestAsset | BundleAssetWithFileHashes;

type ManifestResolutionError = Error & {
  localAssetPath?: string;
  manifestField?: string;
};

/** Inline the contents of each platform's `googleServicesFile` so runtimes can access them. */
export async function resolveGoogleServicesFile(
  projectRoot: string,
  manifest: Partial<Pick<ExpoConfig, 'android' | 'ios'>>
) {
  if (manifest.android?.googleServicesFile) {
    try {
      const contents = await fs.readFile(
        path.resolve(projectRoot, manifest.android.googleServicesFile),
        'utf8'
      );
      manifest.android.googleServicesFile = contents;
    } catch {
      Log.warn(
        `Could not parse Expo config: android.googleServicesFile: "${manifest.android.googleServicesFile}"`
      );
      // Delete the field so Expo Go doesn't attempt to read it.
      delete manifest.android.googleServicesFile;
    }
  }
  if (manifest.ios?.googleServicesFile) {
    try {
      const contents = await fs.readFile(
        path.resolve(projectRoot, manifest.ios.googleServicesFile),
        'base64'
      );
      manifest.ios.googleServicesFile = contents;
    } catch {
      Log.warn(
        `Could not parse Expo config: ios.googleServicesFile: "${manifest.ios.googleServicesFile}"`
      );
      // Delete the field so Expo Go doesn't attempt to read it.
      delete manifest.ios.googleServicesFile;
    }
  }
  return manifest;
}

/**
 * Get all fields in the manifest that match assets, then filter the ones that aren't set.
 *
 * @param manifest
 * @returns Asset fields that the user has set like ["icon", "splash.image", ...]
 */
export async function getAssetFieldPathsForManifestAsync(manifest: ExpoConfig): Promise<string[]> {
  // String array like ["icon", "notification.icon", "loading.icon", "loading.backgroundImage", "ios.icon", ...]
  const sdkAssetFieldPaths = await getAssetSchemasAsync(manifest.sdkVersion);
  return sdkAssetFieldPaths.filter((assetSchema) => get(manifest, assetSchema));
}

/** Resolve all assets in the app.json inline. */
export async function resolveManifestAssets(
  projectRoot: string,
  {
    manifest,
    resolver,
    strict,
  }: {
    manifest: ExpoConfig;
    resolver: (assetPath: string) => Promise<string>;
    strict?: boolean;
  }
) {
  try {
    // Asset fields that the user has set like ["icon", "splash.image"]
    const assetSchemas = await getAssetFieldPathsForManifestAsync(manifest);
    // Get the URLs
    const urls = await Promise.all(
      assetSchemas.map(async (manifestField) => {
        const pathOrURL = get(manifest, manifestField);
        // URL
        if (validateUrl(pathOrURL, { requireProtocol: true })) {
          return pathOrURL;
        }

        // File path
        if (await fileExistsAsync(path.resolve(projectRoot, pathOrURL))) {
          return await resolver(pathOrURL);
        }

        // Unknown
        const err: ManifestResolutionError = new CommandError(
          'MANIFEST_ASSET',
          'Could not resolve local asset: ' + pathOrURL
        );
        err.localAssetPath = pathOrURL;
        err.manifestField = manifestField;
        throw err;
      })
    );

    // Set the corresponding URL fields
    assetSchemas.forEach((manifestField, index: number) =>
      set(manifest, `${manifestField}Url`, urls[index])
    );
  } catch (error: any) {
    if (error.localAssetPath) {
      Log.warn(
        `Unable to resolve asset "${error.localAssetPath}" from "${error.manifestField}" in your app.json or app.config.js`
      );
    } else {
      Log.warn(
        `Warning: Unable to resolve manifest assets. Icons and fonts might not work. ${error.message}.`
      );
    }

    if (strict) {
      throw new CommandError(
        'MANIFEST_ASSET',
        'Failed to export manifest assets: ' + error.message
      );
    }
  }
}
