import {
  createMetroServerAndBundleRequestAsync,
  exportEmbedAssetsAsync,
} from '@expo/cli/build/src/export/embed/exportEmbedAsync';
import { drawableFileTypes } from '@expo/cli/build/src/export/metroAssetLocalPath';
import { resolveEntryPoint } from '@expo/config/paths';
import { HashedAssetData } from '@expo/metro-config/build/transform-worker/getAssets';
import crypto from 'crypto';
import { EmbeddedManifest } from 'expo-manifests';
import fs from 'fs';
import Server from 'metro/src/Server';
import type { BundleOptions } from 'metro/src/shared/types';
import path from 'path';

import { filterPlatformAssetScales } from './filterPlatformAssetScales';

export async function createManifestForBuildAsync(
  platform: 'ios' | 'android',
  possibleProjectRoot: string,
  destinationDir: string,
  entryFileArg?: string
): Promise<void> {
  const entryFile =
    entryFileArg ||
    process.env.ENTRY_FILE ||
    getRelativeEntryPoint(possibleProjectRoot, platform) ||
    'index.js';

  // Remove projectRoot validation when we no longer support React Native <= 62
  let projectRoot: string;
  if (fs.existsSync(path.join(possibleProjectRoot, entryFile))) {
    projectRoot = path.resolve(possibleProjectRoot);
  } else if (fs.existsSync(path.join(possibleProjectRoot, '..', entryFile))) {
    projectRoot = path.resolve(possibleProjectRoot, '..');
  } else {
    throw new Error(
      'Error loading application entry point. If your entry point is not index.js, please set ENTRY_FILE environment variable with your app entry point.'
    );
  }

  process.chdir(projectRoot);

  const options = {
    platform,
    entryFile,
    minify: false,
    dev: process.env.CONFIGURATION === 'Debug', // ensures debug assets packaged correctly for iOS and native debug
    sourcemapUseAbsolutePath: false,
  };

  const { server, bundleRequest } = (await createMetroServerAndBundleRequestAsync(
    projectRoot,
    options
  )) as {
    server: Server;
    bundleRequest: BundleOptions;
  };

  let assets: HashedAssetData[];
  try {
    assets = await exportEmbedAssetsAsync(server, bundleRequest, projectRoot, options);
  } catch (e: any) {
    throw new Error(
      "Error loading assets JSON from Metro. Ensure you've followed all expo-updates installation steps correctly. " +
        e.message
    );
  } finally {
    server.end();
  }

  const manifest: EmbeddedManifest = {
    id: crypto.randomUUID(),
    commitTime: new Date().getTime(),
    assets: [],
  };

  assets.forEach(function (asset) {
    if (!asset.fileHashes) {
      throw new Error(
        'The hashAssetFiles Metro plugin is not configured. You need to add a metro.config.js to your project that configures Metro to use this plugin. See https://github.com/expo/expo/blob/main/packages/expo-updates/README.md#metroconfigjs for an example.'
      );
    }
    filterPlatformAssetScales(platform, asset.scales).forEach(function (scale, index) {
      const baseAssetInfoForManifest = {
        name: asset.name,
        type: asset.type,
        scale,
        packagerHash: asset.fileHashes[index],
        subdirectory: asset.httpServerLocation,
      };
      if (platform === 'ios') {
        manifest.assets.push({
          ...baseAssetInfoForManifest,
          nsBundleDir: getIosDestinationDir(asset),
          nsBundleFilename: scale === 1 ? asset.name : asset.name + '@' + scale + 'x',
        });
      } else if (platform === 'android') {
        manifest.assets.push({
          ...baseAssetInfoForManifest,
          scales: asset.scales,
          resourcesFilename: getAndroidResourceIdentifier(asset),
          resourcesFolder: getAndroidResourceFolderName(asset),
        });
      }
    });
  });

  fs.writeFileSync(path.join(destinationDir, 'app.manifest'), JSON.stringify(manifest));
}

/**
 * Resolve the relative entry file using Expo's resolution method.
 */
function getRelativeEntryPoint(projectRoot: string, platform: 'ios' | 'android'): string {
  const entry = resolveEntryPoint(projectRoot, { platform });
  if (entry) {
    return path.relative(projectRoot, entry);
  }
  return entry;
}

function getAndroidResourceFolderName(asset: HashedAssetData) {
  return (drawableFileTypes as Set<string>).has(asset.type) ? 'drawable' : 'raw';
}

// copied from react-native/Libraries/Image/assetPathUtils.js
function getAndroidResourceIdentifier(asset: HashedAssetData) {
  const folderPath = getBasePath(asset);
  return (folderPath + '/' + asset.name)
    .toLowerCase()
    .replace(/\//g, '_') // Encode folder structure in file name
    .replace(/([^a-z0-9_])/g, '') // Remove illegal chars
    .replace(/^assets_/, ''); // Remove "assets_" prefix
}

function getIosDestinationDir(asset: HashedAssetData) {
  // react-native-cli replaces `..` with `_` when embedding assets in the iOS app bundle
  // https://github.com/react-native-community/cli/blob/0a93be1a42ed1fb05bb0ebf3b82d58b2dd920614/packages/cli/src/commands/bundle/getAssetDestPathIOS.ts
  return getBasePath(asset).replace(/\.\.\//g, '_');
}

// copied from react-native/Libraries/Image/assetPathUtils.js
function getBasePath(asset: HashedAssetData) {
  let basePath = asset.httpServerLocation;
  if (basePath[0] === '/') {
    basePath = basePath.substr(1);
  }
  return basePath;
}
