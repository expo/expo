/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { AssetData } from '@bycedric/metro/metro';
import type { SerialAsset } from '@expo/metro-config/build/serializer/serializerAssets';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import prettyBytes from 'pretty-bytes';

import { Log } from '../log';
import { env } from '../utils/env';

const BLT = '\u203A';

export type BundleOptions = {
  entryPoint: string;
  platform: 'android' | 'ios' | 'web';
  dev?: boolean;
  minify?: boolean;
  bytecode: boolean;
  sourceMapUrl?: string;
  sourcemaps?: boolean;
};

export type BundleAssetWithFileHashes = AssetData & {
  fileHashes: string[]; // added by the hashAssets asset plugin
};

export type BundleOutput = {
  artifacts: SerialAsset[];
  assets: readonly BundleAssetWithFileHashes[];
};

export type ManifestAsset = { fileHashes: string[]; files: string[]; hash: string };

export type Asset = ManifestAsset | BundleAssetWithFileHashes;

export type ExportAssetDescriptor = {
  contents: string | Buffer;
  originFilename?: string;
  /** An identifier for grouping together variations of the same asset. */
  assetId?: string;
  /** Expo Router route path for formatting the HTML output. */
  routeId?: string;
  /** Expo Router API route path for formatting the server function output. */
  apiRouteId?: string;
  /** Expo Router route path for formatting the RSC output. */
  rscId?: string;
  /** A key for grouping together output files by server- or client-side. */
  targetDomain?: 'server' | 'client';
};

export type ExportAssetMap = Map<string, ExportAssetDescriptor>;

export async function persistMetroFilesAsync(files: ExportAssetMap, outputDir: string) {
  if (!files.size) {
    return;
  }
  fs.mkdirSync(path.join(outputDir), { recursive: true });

  // Test fixtures:
  // Log.log(
  //   JSON.stringify(
  //     Object.fromEntries([...files.entries()].map(([k, v]) => [k, { ...v, contents: '' }]))
  //   )
  // );

  const assetEntries: [string, ExportAssetDescriptor][] = [];
  const apiRouteEntries: [string, ExportAssetDescriptor][] = [];
  const routeEntries: [string, ExportAssetDescriptor][] = [];
  const rscEntries: [string, ExportAssetDescriptor][] = [];
  const remainingEntries: [string, ExportAssetDescriptor][] = [];

  let hasServerOutput = false;
  for (const asset of files.entries()) {
    hasServerOutput = hasServerOutput || asset[1].targetDomain === 'server';
    if (asset[1].assetId) assetEntries.push(asset);
    else if (asset[1].routeId != null) routeEntries.push(asset);
    else if (asset[1].apiRouteId != null) apiRouteEntries.push(asset);
    else if (asset[1].rscId != null) rscEntries.push(asset);
    else remainingEntries.push(asset);
  }

  const groups = groupBy(assetEntries, ([, { assetId }]) => assetId!);

  const contentSize = (contents: string | Buffer) => {
    const length =
      typeof contents === 'string' ? Buffer.byteLength(contents, 'utf8') : contents.length;
    return length;
  };

  const sizeStr = (contents: string | Buffer) => {
    const length = contentSize(contents);
    const size = chalk.gray`(${prettyBytes(length)})`;
    return size;
  };

  // TODO: If any Expo Router is used, then use a new style which is more simple:
  // `chalk.gray(/path/to/) + chalk.cyan('route')`
  // | index.html (1.2kb)
  // | /path
  //   | other.html (1.2kb)

  const isExpoRouter = routeEntries.length;

  // Phase out printing all the assets as users can simply check the file system for more info.
  const showAdditionalInfo = !isExpoRouter || env.EXPO_DEBUG;

  const assetGroups = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])) as [
    string,
    [string, ExportAssetDescriptor][],
  ][];

  if (showAdditionalInfo) {
    if (assetGroups.length) {
      const totalAssets = assetGroups.reduce((sum, [, assets]) => sum + assets.length, 0);

      Log.log('');
      Log.log(chalk.bold`${BLT} Assets (${totalAssets}):`);

      for (const [assetId, assets] of assetGroups) {
        const averageContentSize =
          assets.reduce((sum, [, { contents }]) => sum + contentSize(contents), 0) / assets.length;
        Log.log(
          assetId,
          chalk.gray(
            `(${[
              assets.length > 1 ? `${assets.length} variations` : '',
              `${prettyBytes(averageContentSize)}`,
            ]
              .filter(Boolean)
              .join(' | ')})`
          )
        );
      }
    }
  }

  const bundles: Map<string, [string, ExportAssetDescriptor][]> = new Map();
  const other: [string, ExportAssetDescriptor][] = [];

  remainingEntries.forEach(([filepath, asset]) => {
    if (!filepath.match(/_expo\/static\//)) {
      other.push([filepath, asset]);
    } else {
      const platform = filepath.match(/_expo\/static\/js\/([^/]+)\//)?.[1] ?? 'web';
      if (!bundles.has(platform)) bundles.set(platform, []);

      bundles.get(platform)!.push([filepath, asset]);
    }
  });

  [...bundles.entries()].forEach(([platform, assets]) => {
    Log.log('');
    Log.log(chalk.bold`${BLT} ${platform} bundles (${assets.length}):`);

    const allAssets = assets.sort((a, b) => a[0].localeCompare(b[0]));
    while (allAssets.length) {
      const [filePath, asset] = allAssets.shift()!;
      Log.log(filePath, sizeStr(asset.contents));
      if (filePath.match(/\.(js|hbc)$/)) {
        // Get source map
        const sourceMapIndex = allAssets.findIndex(([fp]) => fp === filePath + '.map');
        if (sourceMapIndex !== -1) {
          const [sourceMapFilePath, sourceMapAsset] = allAssets.splice(sourceMapIndex, 1)[0];
          Log.log(chalk.gray(sourceMapFilePath), sizeStr(sourceMapAsset.contents));
        }
      }
    }
  });

  if (showAdditionalInfo && other.length) {
    Log.log('');
    Log.log(chalk.bold`${BLT} Files (${other.length}):`);

    for (const [filePath, asset] of other.sort((a, b) => a[0].localeCompare(b[0]))) {
      Log.log(filePath, sizeStr(asset.contents));
    }
  }

  if (rscEntries.length) {
    Log.log('');
    Log.log(chalk.bold`${BLT} React Server Components (${rscEntries.length}):`);

    for (const [filePath, assets] of rscEntries.sort((a, b) => a[0].length - b[0].length)) {
      const id = assets.rscId!;
      Log.log(
        '/' + (id === '' ? chalk.gray(' (index)') : id),
        sizeStr(assets.contents),
        chalk.gray(filePath)
      );
    }
  }

  if (routeEntries.length) {
    Log.log('');
    Log.log(chalk.bold`${BLT} Static routes (${routeEntries.length}):`);

    for (const [, assets] of routeEntries.sort((a, b) => a[0].length - b[0].length)) {
      const id = assets.routeId!;
      Log.log('/' + (id === '' ? chalk.gray(' (index)') : id), sizeStr(assets.contents));
    }
  }

  if (apiRouteEntries.length) {
    const apiRoutesWithoutSourcemaps = apiRouteEntries.filter(
      (route) => !route[0].endsWith('.map')
    );
    Log.log('');
    Log.log(chalk.bold`${BLT} API routes (${apiRoutesWithoutSourcemaps.length}):`);

    for (const [apiRouteFilename, assets] of apiRoutesWithoutSourcemaps.sort(
      (a, b) => a[0].length - b[0].length
    )) {
      const id = assets.apiRouteId!;
      const hasSourceMap = apiRouteEntries.find(
        ([filename, route]) =>
          filename !== apiRouteFilename &&
          route.apiRouteId === assets.apiRouteId &&
          filename.endsWith('.map')
      );
      Log.log(
        id === '' ? chalk.gray(' (index)') : id,
        sizeStr(assets.contents),
        hasSourceMap ? chalk.gray(`(source map ${sizeStr(hasSourceMap[1].contents)})`) : ''
      );
    }
  }

  // Decouple logging from writing for better performance.

  await Promise.all(
    [...files.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(async ([file, { contents, targetDomain }]) => {
        // NOTE: Only use `targetDomain` if we have at least one server asset
        const domain = (hasServerOutput && targetDomain) || '';
        const outputPath = path.join(outputDir, domain, file);
        await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.promises.writeFile(outputPath, contents);
      })
  );

  Log.log('');
}

function groupBy<T>(array: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  array.forEach((item) => {
    const group = key(item);
    const list = map.get(group) ?? [];
    list.push(item);
    map.set(group, list);
  });
  return map;
}

// TODO: Move source map modification to the serializer
export function getFilesFromSerialAssets(
  resources: SerialAsset[],
  {
    includeSourceMaps,
    files = new Map(),
    platform,
    isServerHosted = platform === 'web',
  }: {
    includeSourceMaps: boolean;
    files?: ExportAssetMap;
    platform?: string;
    isServerHosted?: boolean;
  }
) {
  resources.forEach((resource) => {
    if (resource.type === 'css-external') {
      return;
    }
    files.set(resource.filename, {
      contents: resource.source,
      originFilename: resource.originFilename,
      targetDomain: isServerHosted ? 'client' : undefined,
    });
  });

  return files;
}
