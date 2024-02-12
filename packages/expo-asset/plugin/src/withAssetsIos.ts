import { ExpoConfig } from '@expo/config-types';
import { generateImageAsync } from '@expo/image-utils';
import {
  ContentsJsonImage,
  createContentsJsonItem,
  writeContentsJsonAsync,
} from '@expo/prebuild-config/build/plugins/icons/AssetContents';
import {
  ConfigPlugin,
  IOSConfig,
  InfoPlist,
  XcodeProject,
  withInfoPlist,
  withXcodeProject,
} from 'expo/config-plugins';
import { ensureDir, writeFile } from 'fs-extra';
import path from 'path';

import { fontTypes, imageTypes, resolveAssetPaths, validateAssets } from './utils';

const IMAGE_DIR = 'Images.xcassets';

export const withAssetsIos: ConfigPlugin<string[]> = (config, assets) => {
  config = addAssetsToTarget(config, assets);
  config = addFontsToPlist(config, assets);
  return config;
};

function addAssetsToTarget(config: ExpoConfig, assets: string[]) {
  return withXcodeProject(config, async (config) => {
    const resolvedAssets = await resolveAssetPaths(assets, config.modRequest.projectRoot);
    const validAssets = validateAssets(resolvedAssets);
    const project = config.modResults;
    const platformProjectRoot = config.modRequest.platformProjectRoot;
    IOSConfig.XcodeUtils.ensureGroupRecursively(project, 'Resources');

    const images = validAssets.filter((asset) => imageTypes.includes(path.extname(asset)));
    const assetsForResourcesDir = validAssets.filter(
      (asset) => !imageTypes.includes(path.extname(asset))
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
    const image = path.basename(asset);

    const assetPath = path.resolve(iosNamedProjectRoot, `${IMAGE_DIR}/${name}.imageset`);
    await ensureDir(assetPath);

    const buffer = await generateImageAsync({ projectRoot: root }, { src: asset } as any);
    await writeFile(path.resolve(assetPath, image), buffer.source);

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
    createContentsJsonItem({
      idiom: 'universal',
      filename: image,
      scale: '1x',
    }),
    createContentsJsonItem({
      idiom: 'universal',
      scale: '2x',
    }),
    createContentsJsonItem({
      idiom: 'universal',
      scale: '3x',
    }),
  ].filter(Boolean) as ContentsJsonImage[];
}

function addFontsToPlist(config: ExpoConfig, fonts: string[]) {
  return withInfoPlist(config, async (config) => {
    const resolvedAssets = await resolveAssetPaths(fonts, config.modRequest.projectRoot);
    const resolvedFonts = resolvedAssets.filter((asset) => fontTypes.includes(path.extname(asset)));

    if (!resolvedFonts) {
      return config;
    }

    const existingFonts = getUIAppFonts(config.modResults);
    const fontList = resolvedFonts.map((font) => path.basename(font)) ?? [];
    const allFonts = [...existingFonts, ...fontList];
    config.modResults.UIAppFonts = Array.from(new Set(allFonts));

    return config;
  });
}

function getUIAppFonts(infoPlist: InfoPlist): string[] {
  const fonts = infoPlist['UIAppFonts'];
  if (fonts != null && Array.isArray(fonts) && fonts.every((font) => typeof font === 'string')) {
    return fonts as string[];
  }
  return [];
}
