/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { SerialAsset } from '@expo/metro-config/build/serializer/serializerAssets';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import prettyBytes from 'pretty-bytes';

import { BundleAssetWithFileHashes } from './fork-bundleAsync';
import { Log } from '../log';

export type ManifestAsset = { fileHashes: string[]; files: string[]; hash: string };

export type Asset = ManifestAsset | BundleAssetWithFileHashes;

export type ExportAssetDescriptor = {
  contents: string | Buffer;
  originFilename?: string;
  /** An identifier for grouping together variations of the same asset. */
  assetId?: string;
  /** Expo Router route path for formatting the HTML output. */
  routeId?: string;
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
  const routeEntries: [string, ExportAssetDescriptor][] = [];
  const remainingEntries: [string, ExportAssetDescriptor][] = [];

  let hasServerOutput = false;
  for (const asset of files.entries()) {
    hasServerOutput = hasServerOutput || asset[1].targetDomain === 'server';
    if (asset[1].assetId) assetEntries.push(asset);
    else if (asset[1].routeId != null) routeEntries.push(asset);
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

  if (routeEntries.length) {
    const plural = routeEntries.length === 1 ? '' : 's';

    Log.log('');
    Log.log(chalk.bold`Exporting ${routeEntries.length} static route${plural}:`);

    for (const [, assets] of routeEntries.sort((a, b) => a[0].length - b[0].length)) {
      const id = assets.routeId!;
      Log.log('/' + (id === '' ? chalk.gray(' (index)') : id), sizeStr(assets.contents));
    }
  }

  const assetGroups = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])) as [
    string,
    [string, ExportAssetDescriptor][],
  ][];

  if (assetGroups.length) {
    const totalAssets = assetGroups.reduce((sum, [, assets]) => sum + assets.length, 0);
    const plural = totalAssets === 1 ? '' : 's';

    Log.log('');
    Log.log(chalk.bold`Exporting ${totalAssets} asset${plural}:`);

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
    const plural = assets.length === 1 ? '' : 's';
    Log.log(chalk.bold`Exporting ${assets.length} bundle${plural} for ${platform}:`);

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

  if (other.length) {
    Log.log('');
    const plural = other.length === 1 ? '' : 's';
    Log.log(chalk.bold`Exporting ${other.length} file${plural}:`);

    for (const [filePath, asset] of other.sort((a, b) => a[0].localeCompare(b[0]))) {
      Log.log(filePath, sizeStr(asset.contents));
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
  }: {
    includeSourceMaps: boolean;
    files?: ExportAssetMap;
    platform?: string;
  }
) {
  resources.forEach((resource) => {
    files.set(resource.filename, {
      contents: resource.source,
      originFilename: resource.originFilename,
      targetDomain: platform === 'web' ? 'client' : undefined,
    });
  });

  return files;
}
