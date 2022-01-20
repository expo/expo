import { ExpoConfig } from '@expo/config';
import { BundleAssetWithFileHashes } from '@expo/dev-server';
import fs from 'fs-extra';
// TODO: NO LODASH
import get from 'lodash/get';
import set from 'lodash/set';
import path from 'path';

import * as Log from '../../log';
import { CommandError } from '../../utils/errors';
import * as ExpoConfigSchema from './ExpoConfigSchema';

type ManifestAsset = { fileHashes: string[]; files: string[]; hash: string };

export type Asset = ManifestAsset | BundleAssetWithFileHashes;

type ManifestResolutionError = Error & {
  localAssetPath?: string;
  manifestField?: string;
};

export async function resolveGoogleServicesFile(projectRoot: string, manifest: ExpoConfig) {
  if (manifest.android?.googleServicesFile) {
    const contents = await fs.readFile(
      path.resolve(projectRoot, manifest.android.googleServicesFile),
      'utf8'
    );
    manifest.android.googleServicesFile = contents;
  }
  if (manifest.ios?.googleServicesFile) {
    const contents = await fs.readFile(
      path.resolve(projectRoot, manifest.ios.googleServicesFile),
      'base64'
    );
    manifest.ios.googleServicesFile = contents;
  }
}

/**
 * Get all fields in the manifest that match assets, then filter the ones that aren't set.
 *
 * @param manifest
 * @returns Asset fields that the user has set like ["icon", "splash.image", ...]
 */
async function getAssetFieldPathsForManifestAsync(manifest: ExpoConfig): Promise<string[]> {
  // String array like ["icon", "notification.icon", "loading.icon", "loading.backgroundImage", "ios.icon", ...]
  const sdkAssetFieldPaths = await ExpoConfigSchema.getAssetSchemasAsync(manifest.sdkVersion);
  return sdkAssetFieldPaths.filter((assetSchema) => get(manifest, assetSchema));
}

export async function resolveManifestAssets({
  projectRoot,
  manifest,
  resolver,
  strict = false,
}: {
  projectRoot: string;
  manifest: ExpoConfig;
  resolver: (assetPath: string) => Promise<string>;
  strict?: boolean;
}) {
  try {
    // Asset fields that the user has set like ["icon", "splash.image"]
    const assetSchemas = await getAssetFieldPathsForManifestAsync(manifest);
    // Get the URLs
    const urls = await Promise.all(
      assetSchemas.map(async (manifestField) => {
        const pathOrURL = get(manifest, manifestField);
        if (/^https?:\/\//.test(pathOrURL)) {
          // It's a remote URL
          return pathOrURL;
        } else if (fs.existsSync(path.resolve(projectRoot, pathOrURL))) {
          return await resolver(pathOrURL);
        } else {
          const err: ManifestResolutionError = new Error('Could not resolve local asset.');
          err.localAssetPath = pathOrURL;
          err.manifestField = manifestField;
          throw err;
        }
      })
    );

    // Set the corresponding URL fields
    assetSchemas.forEach((manifestField, index: number) =>
      set(manifest, `${manifestField}Url`, urls[index])
    );
  } catch (e) {
    let logMethod = Log.warn;
    if (strict) {
      logMethod = Log.error;
    }
    if (e.localAssetPath) {
      logMethod(
        `Unable to resolve asset "${e.localAssetPath}" from "${e.manifestField}" in your app.json or app.config.js`
      );
    } else {
      logMethod(`Warning: Unable to resolve manifest assets. Icons might not work. ${e.message}.`);
    }

    if (strict) {
      throw new CommandError('Resolving assets failed.');
    }
  }
}
