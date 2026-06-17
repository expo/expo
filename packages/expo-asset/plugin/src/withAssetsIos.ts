import { generateImageAsync, ImageOptions } from '@expo/image-utils';
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
    IOSConfig.XcodeUtils.ensureGroupRecursively(project, 'Resources');

    const images = validAssets.filter((asset) => IMAGE_TYPES.includes(path.extname(asset)));
    const assetsForResourcesDir = validAssets.filter(
      (asset) => !IMAGE_TYPES.includes(path.extname(asset))
    );

    await addImageAssets(images, config.modRequest.projectRoot);
    addResourceFiles(project, platformProjectRoot, assetsForResourcesDir);

    return config;
  });
}

function addResourceFiles(project: XcodeProject, platformRoot: string, assets: string[]) {
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
}

async function addImageAssets(assets: string[], root: string) {
  const iosNamedProjectRoot = IOSConfig.Paths.getSourceRoot(root);
  for (const asset of assets) {
    const name = path.basename(asset, path.extname(asset));
    const ext = path.extname(asset);
    const isGif = ext.toLowerCase() === '.gif';

    // As GIFs are not supported by iOS asset catalogs, convert to PNG; for others, use original extension
    const outputImage = isGif ? `${name}.png` : path.basename(asset);

    const assetPath = path.resolve(iosNamedProjectRoot, `${IMAGE_DIR}/${name}.imageset`);
    await fs.mkdir(assetPath, { recursive: true });

    if (isGif) {
      // GIFs need to be converted to PNG since iOS asset catalogs don't support animated GIFs
      // Use generateImageAsync to handle the conversion properly
      const buffer = await generateImageAsync({ projectRoot: root }, {
        src: asset,
      } as unknown as ImageOptions);
      await fs.writeFile(path.resolve(assetPath, outputImage), buffer.source);
    } else {
      // For PNG and JPG, copy the file directly to preserve all original properties including transparency
      await fs.copyFile(asset, path.resolve(assetPath, outputImage));
    }

    await writeContentsJsonFileAsync({
      assetPath,
      image: outputImage,
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
