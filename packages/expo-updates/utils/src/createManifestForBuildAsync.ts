import type { HashedAssetData } from '@expo/metro-config/build/transform-worker/getAssets';
import { drawableFileTypes, getAndroidResourceIdentifier } from '@react-native/asset-utils';
import crypto from 'crypto';
import type { EmbeddedManifest } from 'expo-manifests';
import { resolveEntryPoint } from 'expo/config/paths';
import {
  createMetroServerAndBundleRequestAsync,
  exportEmbedAssetsAsync,
} from 'expo/internal/unstable-expo-updates-cli-exports';
import fs from 'fs';
import path from 'path';

import { filterPlatformAssetScales } from './filterPlatformAssetScales';

export async function createManifestForBuildAsync(
  platform: 'ios' | 'android',
  projectRoot: string,
  destinationDir: string,
  entryFileArg?: string
): Promise<void> {
  const entryFile =
    entryFileArg ||
    process.env.ENTRY_FILE ||
    resolveEntryPoint(projectRoot, { platform }) ||
    'index.js';

  process.chdir(projectRoot);

  const options = {
    platform,
    entryFile,
    minify: false,
    dev: process.env.CONFIGURATION === 'Debug', // ensures debug assets packaged correctly for iOS and native debug
    sourcemapUseAbsolutePath: false,
    resetCache: false,
  };

  const { server, bundleRequest } = await createMetroServerAndBundleRequestAsync(
    projectRoot,
    options
  );

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
    const platformScales = new Set(filterPlatformAssetScales(platform, asset.scales));
    asset.scales.forEach(function (scale, index) {
      if (!platformScales.has(scale)) {
        return;
      }
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

function getAndroidResourceFolderName(asset: HashedAssetData) {
  return drawableFileTypes.has(asset.type) ? 'drawable' : 'raw';
}

function getIosDestinationDir(asset: HashedAssetData) {
  // react-native-cli replaces `..` with `_` when embedding assets in the iOS app bundle
  // https://github.com/react-native-community/cli/blob/0a93be1a42ed1fb05bb0ebf3b82d58b2dd920614/packages/cli/src/commands/bundle/getAssetDestPathIOS.ts
  return getBasePath(asset).replace(/\.\.\//g, '_');
}

function getBasePath(asset: HashedAssetData) {
  const basePath = asset.httpServerLocation;
  return basePath.startsWith('/') ? basePath.slice(1) : basePath;
}
