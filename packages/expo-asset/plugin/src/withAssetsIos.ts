import { type ImageOptions, generateImageAsync } from '@expo/image-utils';
import type { ExpoConfig } from 'expo/config';
import {
  type ConfigPlugin,
  IOSConfig,
  type XcodeProject,
  withXcodeProject,
} from 'expo/config-plugins';
import fs from 'fs/promises';
import path from 'path';

import { type ContentsJsonImage, writeContentsJsonAsync } from './AssetContents';
import { IMAGE_TYPES, resolveAssetPaths, validateAssets } from './utils';

const IMAGE_DIR = 'Images.xcassets';

export const withAssetsIos: ConfigPlugin<string[]> = (config, assets) => {
  config = addAssetsToTarget(config, assets);
  return config;
};

function addAssetsToTarget(config: ExpoConfig, assets: string[]) {
  return withXcodeProject(config, async (config) => {
    const resolvedAssets = await resolveAssetPaths(assets, config.modRequest.projectRoot);
    const validAssets = validateAssets(resolvedAssets, 'ios');
    const project = config.modResults;
    const platformProjectRoot = config.modRequest.platformProjectRoot;

    const images = validAssets.filter((asset) => IMAGE_TYPES.includes(path.extname(asset)));
    const assetsForResourcesDir = validAssets.filter(
      (asset) => !IMAGE_TYPES.includes(path.extname(asset))
    );

    await addImageAssets(images, config.modRequest.projectRoot);
    await addResourceFiles(
      project,
      platformProjectRoot,
      path.join(platformProjectRoot, config.modRequest.projectName!),
      assetsForResourcesDir
    );

    return config;
  });
}

async function addResourceFiles(
  project: XcodeProject,
  platformRoot: string,
  syncGroup: string,
  assets: string[]
) {
  if (!IOSConfig.XcodeUtils.isAppTargetUsingFileSystemSynchronizedGroups(project)) {
    IOSConfig.XcodeUtils.ensureGroupRecursively(project, 'Resources');
    // TODO: Deprecate support for non-synchronized groups after SDK 55.
    for (const asset of assets) {
      const assetPath = path.relative(platformRoot, asset);
      IOSConfig.XcodeUtils.addResourceFileToGroup({
        filepath: assetPath,
        groupName: 'Resources',
        project,
        isBuildFile: true,
        verbose: true,
      });
    }
  } else {
    // Copy assets to app group
    const assetsDirectory = path.join(syncGroup, 'assets');
    await fs.mkdir(assetsDirectory, { recursive: true });
    const projectRoot = path.join(platformRoot, '..');
    for (const asset of assets) {
      const relativeToProjectRoot = path.relative(projectRoot, asset);
      const destPath = path.join(assetsDirectory, relativeToProjectRoot);
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.copyFile(asset, destPath);
    }
  }
}

async function addImageAssets(assets: string[], root: string) {
  const iosNamedProjectRoot = IOSConfig.Paths.getSourceRoot(root);
  for (const asset of assets) {
    const name = path.basename(asset, path.extname(asset));
    const image = path.basename(asset);

    const assetPath = path.resolve(iosNamedProjectRoot, `${IMAGE_DIR}/${name}.imageset`);
    await fs.mkdir(assetPath, { recursive: true });

    const buffer = await generateImageAsync({ projectRoot: root }, {
      src: asset,
    } as unknown as ImageOptions);
    await fs.writeFile(path.resolve(assetPath, image), buffer.source);

    await writeContentsJsonFileAsync({
      assetPath,
      image,
    });
  }
}

async function writeContentsJsonFileAsync({
  assetPath,
  image,
}: {
  assetPath: string;
  image: string;
}) {
  const images = buildContentsJsonImages({ image });
  await writeContentsJsonAsync(assetPath, { images });
}

function buildContentsJsonImages({ image }: { image: string }): ContentsJsonImage[] {
  return [
    { idiom: 'universal', filename: image, scale: '1x' },
    { idiom: 'universal', scale: '2x' },
    { idiom: 'universal', scale: '3x' },
  ];
}
