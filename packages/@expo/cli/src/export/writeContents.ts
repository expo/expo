import fs from 'fs/promises';
import path from 'path';

import { createMetadataJson } from './createMetadataJson';
import { BundleOutput } from './fork-bundleAsync';
import { Asset } from './saveAssets';

const debug = require('debug')('expo:export:write') as typeof console.log;

export async function writeMetadataJsonAsync({
  outputDir,
  bundles,
  fileNames,
  embeddedHashSet,
}: {
  outputDir: string;
  bundles: Record<string, Pick<BundleOutput, 'assets'> | undefined>;
  fileNames: Record<string, string[]>;
  embeddedHashSet?: Set<string>;
}) {
  const contents = createMetadataJson({
    bundles,
    fileNames,
    embeddedHashSet,
  });
  // const metadataPath = path.join(outputDir, 'metadata.json');
  // debug(`Writing metadata.json to ${metadataPath}`);
  // await fs.writeFile(metadataPath, JSON.stringify(contents));
  return ['metadata.json', contents];
}

export function createAssetMap({ assets }: { assets: Asset[] }) {
  // Convert the assets array to a k/v pair where the asset hash is the key and the asset is the value.
  return Object.fromEntries(assets.map((asset) => [asset.hash, asset]));
}
export async function writeAssetMapAsync({
  outputDir,
  assets,
}: {
  outputDir: string;
  assets: Asset[];
}) {
  // Convert the assets array to a k/v pair where the asset hash is the key and the asset is the value.
  const contents = Object.fromEntries(assets.map((asset) => [asset.hash, asset]));
  await fs.writeFile(path.join(outputDir, 'assetmap.json'), JSON.stringify(contents));
  return contents;
}

export function createSourceMapDebugHtml({ fileNames }: { fileNames: string[] }) {
  // Make a debug html so user can debug their bundles
  const contents = `
      ${fileNames
        .filter((value) => value != null)
        .map((fileName) => `<script src="${fileName}"></script>`)
        .join('\n      ')}
      Open up this file in Chrome. In the JavaScript developer console, navigate to the Source tab.
      You can see a red colored folder containing the original source code from your bundle.
      `;
  return contents;

  // await fs.writeFile(path.join(outputDir, 'debug.html'), contents);
  // return contents;
}
