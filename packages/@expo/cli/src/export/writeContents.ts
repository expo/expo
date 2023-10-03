import { Platform } from '@expo/config';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import { createMetadataJson } from './createMetadataJson';
import { BundleOutput } from './fork-bundleAsync';
import { Asset } from './saveAssets';

const debug = require('debug')('expo:export:write') as typeof console.log;

/**
 * @param props.platform native platform for the bundle
 * @param props.format extension to use for the name
 * @param props.hash crypto hash for the bundle contents
 * @returns filename for the JS bundle.
 */
function createBundleFileName({
  platform,
  format,
  hash,
}: {
  platform: string;
  format: 'javascript' | 'bytecode';
  hash: string;
}): string {
  return `${platform}-${hash}.${format === 'javascript' ? 'js' : 'hbc'}`;
}

/**
 * @param bundle JS bundle as a string
 * @returns crypto hash for the provided bundle
 */
function createBundleHash(bundle: string | Uint8Array): string {
  return crypto.createHash('md5').update(bundle).digest('hex');
}

export async function writeBundlesAsync({
  bundles,
  outputDir,
  useServerRendering,
}: {
  bundles: Partial<Record<Platform, Pick<BundleOutput, 'hermesBytecodeBundle' | 'code'>>>;
  outputDir: string;
  useServerRendering?: boolean;
}) {
  const hashes: Partial<Record<Platform, string>> = {};
  const fileNames: Partial<Record<Platform, string>> = {};

  for (const [platform, bundleOutput] of Object.entries(bundles) as [
    Platform,
    Pick<BundleOutput, 'hermesBytecodeBundle' | 'code'>,
  ][]) {
    // TODO: Move native to use the newer `_expo/...` bundle writing system.
    if (platform === 'web' && useServerRendering) {
      continue;
    }
    const bundle = bundleOutput.hermesBytecodeBundle ?? bundleOutput.code;
    const hash = createBundleHash(bundle);
    const fileName = createBundleFileName({
      platform,
      format: bundleOutput.hermesBytecodeBundle ? 'bytecode' : 'javascript',
      hash,
    });

    hashes[platform] = hash;
    fileNames[platform] = fileName;
    await fs.writeFile(path.join(outputDir, fileName), bundle);
  }

  return { hashes, fileNames };
}

type SourceMapWriteResult = {
  platform: string;
  fileName: string;
  hash: string;
  map: string;
  comment: string;
};

export async function writeSourceMapsAsync({
  bundles,
  hashes,
  fileNames,
  outputDir,
}: {
  bundles: Partial<
    Record<string, Pick<BundleOutput, 'hermesSourcemap' | 'map' | 'hermesBytecodeBundle' | 'code'>>
  >;
  hashes?: Record<string, string | undefined>;
  fileNames?: Record<string, string | undefined>;
  outputDir: string;
}): Promise<SourceMapWriteResult[]> {
  return (
    await Promise.all(
      Object.entries(bundles).map(async ([platform, bundle]) => {
        if (!bundle) return null;
        const sourceMap = bundle.hermesSourcemap ?? bundle.map;
        if (!sourceMap) {
          debug(`Skip writing sourcemap (platform: ${platform})`);
          return null;
        }

        const hash =
          hashes?.[platform] ?? createBundleHash(bundle.hermesBytecodeBundle ?? bundle.code!);
        const mapName = `${platform}-${hash}.map`;
        await fs.writeFile(path.join(outputDir, mapName), sourceMap);

        const jsBundleFileName =
          fileNames?.[platform] ??
          createBundleFileName({
            platform,
            format: bundle.hermesBytecodeBundle ? 'bytecode' : 'javascript',
            hash,
          });
        const jsPath = path.join(outputDir, jsBundleFileName);

        // Add correct mapping to sourcemap paths
        const mappingComment = `\n//# sourceMappingURL=${mapName}`;
        await fs.appendFile(jsPath, mappingComment);
        return {
          platform,
          fileName: mapName,
          hash,
          map: sourceMap,
          comment: mappingComment,
        };
      })
    )
  ).filter(Boolean) as SourceMapWriteResult[];
}

export async function writeMetadataJsonAsync({
  outputDir,
  bundles,
  fileNames,
}: {
  outputDir: string;
  bundles: Record<string, Pick<BundleOutput, 'assets'> | undefined>;
  fileNames: Record<string, string | undefined>;
}) {
  const contents = createMetadataJson({
    bundles,
    fileNames,
  });
  const metadataPath = path.join(outputDir, 'metadata.json');
  debug(`Writing metadata.json to ${metadataPath}`);
  await fs.writeFile(metadataPath, JSON.stringify(contents));
  return contents;
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

export async function writeDebugHtmlAsync({
  outputDir,
  fileNames,
}: {
  outputDir: string;
  fileNames: Record<string, string | undefined>;
}) {
  // Make a debug html so user can debug their bundles
  const contents = `
      ${Object.values(fileNames)
        .filter((value) => value != null)
        .map((fileName) => `<script src="${path.join('bundles', fileName!)}"></script>`)
        .join('\n      ')}
      Open up this file in Chrome. In the JavaScript developer console, navigate to the Source tab.
      You can see a red colored folder containing the original source code from your bundle.
      `;

  await fs.writeFile(path.join(outputDir, 'debug.html'), contents);
  return contents;
}
