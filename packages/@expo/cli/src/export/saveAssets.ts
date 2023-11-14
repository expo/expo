/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import prettyBytes from 'pretty-bytes';
import { SerialAsset } from '@expo/metro-config/build/serializer/serializerAssets';

import { Log } from '../log';
import { BundleAssetWithFileHashes } from './fork-bundleAsync';

export type ManifestAsset = { fileHashes: string[]; files: string[]; hash: string };

export type Asset = ManifestAsset | BundleAssetWithFileHashes;

export type ExportAssetDescriptor = string | Buffer;

export type ExportAssetMap = Map<string, ExportAssetDescriptor>;

export async function persistMetroFilesAsync(files: ExportAssetMap, outputDir: string) {
  fs.mkdirSync(path.join(outputDir), { recursive: true });
  if (!files.size) {
    return;
  }

  Log.log('');

  const plural = files.size === 1 ? '' : 's';
  Log.log(chalk.bold`Exporting ${files.size} file${plural}:`);
  await Promise.all(
    [...files.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(async ([file, contents]) => {
        const length =
          typeof contents === 'string' ? Buffer.byteLength(contents, 'utf8') : contents.length;
        Log.log(file, chalk.gray`(${prettyBytes(length)})`);
        const outputPath = path.join(outputDir, file);
        await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.promises.writeFile(outputPath, contents);
      })
  );
  Log.log('');
}

// TODO: Move source map modification to the serializer
export function getFilesFromSerialAssets(
  resources: SerialAsset[],
  {
    includeMaps,
    files = new Map(),
  }: {
    includeMaps: boolean;
    files?: ExportAssetMap;
  }
) {
  resources.forEach((resource) => {
    files.set(
      resource.filename,
      modifyBundlesWithSourceMaps(resource.filename, resource.source, includeMaps)
    );
  });

  return files;
}

export function modifyBundlesWithSourceMaps(
  filename: string,
  source: string,
  includeMaps: boolean
): string {
  if (filename.endsWith('.js')) {
    // If the bundle ends with source map URLs then update them to point to the correct location.

    // TODO: baseUrl support
    const normalizedFilename = '/' + filename.replace(/^\/+/, '');
    // Ref: https://developer.chrome.com/blog/sourcemaps/#sourceurl-and-displayname-in-action-eval-and-anonymous-functions
    //# sourceMappingURL=//localhost:8085/index.map?platform=web&dev=false&hot=false&lazy=true&minify=true&resolver.environment=client&transform.environment=client&serializer.output=static
    //# sourceURL=http://localhost:8085/index.bundle//&platform=web&dev=false&hot=false&lazy=true&minify=true&resolver.environment=client&transform.environment=client&serializer.output=static
    return source.replace(/^\/\/# (sourceMappingURL|sourceURL)=.*$/gm, (...props) => {
      if (includeMaps) {
        // TODO: Drop sourceURL when the name is the same as the file output location.
        if (props[1] === 'sourceURL') {
          return `//# ${props[1]}=` + normalizedFilename;
        } else if (props[1] === 'sourceMappingURL') {
          const mapName = normalizedFilename + '.map';
          return `//# ${props[1]}=` + mapName;
        }
      }
      return '';
    });
  }
  return source;
}
