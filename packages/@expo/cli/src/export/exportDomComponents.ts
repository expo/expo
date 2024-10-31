import type { ExpoConfig } from '@expo/config';
import assert from 'assert';
import crypto from 'crypto';
import path from 'path';
import resolveFrom from 'resolve-from';

import { type PlatformMetadata } from './createMetadataJson';
import { type BundleOutput, type ExportAssetMap, getFilesFromSerialAssets } from './saveAssets';
import { type MetroBundlerDevServer } from '../start/server/metro/MetroBundlerDevServer';
import { serializeHtmlWithAssets } from '../start/server/metro/serializeHtml';
import {
  getDomComponentHtml,
  DOM_COMPONENTS_BUNDLE_DIR,
} from '../start/server/middleware/DomComponentsMiddleware';
import { env } from '../utils/env';
import { resolveRealEntryFilePath } from '../utils/filePath';

const debug = require('debug')('expo:export:exportDomComponents') as typeof console.log;

// TODO(EvanBacon): determine how to support DOM Components with hosting.
export async function exportDomComponentAsync({
  filePath,
  projectRoot,
  dev,
  devServer,
  isHermes,
  includeSourceMaps,
  exp,
  files,
}: {
  filePath: string;
  projectRoot: string;
  dev: boolean;
  devServer: MetroBundlerDevServer;
  isHermes: boolean;
  includeSourceMaps: boolean;
  exp: ExpoConfig;
  files: ExportAssetMap;
}): Promise<{
  bundle: BundleOutput;
  htmlOutputName: string;
}> {
  const virtualEntry = resolveFrom(projectRoot, 'expo/dom/entry.js');
  debug('Bundle DOM Component:', filePath);
  // MUST MATCH THE BABEL PLUGIN!
  const hash = crypto.createHash('sha1').update(filePath).digest('hex');
  const outputName = `${DOM_COMPONENTS_BUNDLE_DIR}/${hash}.html`;
  const generatedEntryPath = filePath.startsWith('file://') ? filePath.slice(7) : filePath;
  const baseUrl = `/${DOM_COMPONENTS_BUNDLE_DIR}`;
  const relativeImport = './' + path.relative(path.dirname(virtualEntry), generatedEntryPath);
  // Run metro bundler and create the JS bundles/source maps.
  const bundle = await devServer.legacySinglePageExportBundleAsync({
    platform: 'web',
    domRoot: encodeURI(relativeImport),
    splitChunks: !env.EXPO_NO_BUNDLE_SPLITTING,
    mainModuleName: resolveRealEntryFilePath(projectRoot, virtualEntry),
    mode: dev ? 'development' : 'production',
    engine: isHermes ? 'hermes' : undefined,
    serializerIncludeMaps: includeSourceMaps,
    bytecode: false,
    reactCompiler: !!exp.experiments?.reactCompiler,
    baseUrl: './',
    // Minify may be false because it's skipped on native when Hermes is enabled, default to true.
    minify: true,
  });

  const html = await serializeHtmlWithAssets({
    isExporting: true,
    resources: bundle.artifacts,
    template: getDomComponentHtml(),
    baseUrl: './',
  });

  const serialAssets = bundle.artifacts.map((a) => {
    return {
      ...a,
      filename: path.join(baseUrl, a.filename),
    };
  });

  getFilesFromSerialAssets(serialAssets, {
    includeSourceMaps,
    files,
    platform: 'web',
  });

  files.set(outputName, {
    contents: html,
  });

  return {
    bundle,
    htmlOutputName: outputName,
  };
}

/**
 * For EAS Updates exports,
 * post-processes the DOM component bundle and updates the asset paths to use flattened MD5 naming.
 */
export function updateDomComponentAssetsForMD5Naming({
  domComponentReference,
  nativeBundle,
  domComponentBundle,
  files,
  htmlOutputName,
}: {
  domComponentReference: string;
  nativeBundle: BundleOutput;
  domComponentBundle: BundleOutput;
  files: ExportAssetMap;
  htmlOutputName: string;
}): PlatformMetadata['assets'] {
  const assetsMetadata: PlatformMetadata['assets'] = [];

  for (const artifact of domComponentBundle.artifacts) {
    if (artifact.type !== 'js') {
      continue;
    }
    const artifactAssetName = `/${DOM_COMPONENTS_BUNDLE_DIR}/${artifact.filename}`;
    let source = artifact.source;

    // [0] Updates asset paths in the DOM component JS bundle (which is a web bundle)
    for (const asset of domComponentBundle.assets) {
      const prefix = asset.httpServerLocation.startsWith('./')
        ? asset.httpServerLocation.slice(2)
        : asset.httpServerLocation;
      const uri = `${prefix}/${asset.name}.${asset.type}`;
      const regexp = new RegExp(`(uri:")(${uri})(")`, 'g');
      const index = asset.scales.findIndex((s) => s === 1) ?? 0; // DOM components (web) uses 1x assets
      const md5 = asset.fileHashes[index];
      source = source.replace(regexp, `$1${md5}.${asset.type}$3`);

      const domJsAssetEntity = files.get(artifactAssetName);
      assert(domJsAssetEntity);
      domJsAssetEntity.contents = source;
    }

    // [1] Updates JS artifacts in HTML
    const md5 = crypto.createHash('md5').update(source).digest('hex');
    const htmlAssetEntity = files.get(htmlOutputName);
    assert(htmlAssetEntity);
    const regexp = new RegExp(`(<script src=")(.*${artifact.filename})(" defer></script>)`, 'g');
    htmlAssetEntity.contents = htmlAssetEntity.contents.toString().replace(regexp, `$1${md5}.js$3`);

    assetsMetadata.push({
      path: artifactAssetName.slice(1),
      ext: 'js',
    });
  }

  // [2] Updates HTML names from native bundle
  const htmlContent = files.get(htmlOutputName);
  assert(htmlContent);
  const htmlMd5 = crypto.createHash('md5').update(htmlContent.contents.toString()).digest('hex');
  const hash = crypto.createHash('sha1').update(domComponentReference).digest('hex');
  for (const artifact of nativeBundle.artifacts) {
    if (artifact.type !== 'js') {
      continue;
    }
    const assetEntity = files.get(artifact.filename);
    assert(assetEntity);
    const regexp = new RegExp(
      `(\\buri:.*process\\.env\\.EXPO_DOM_BASE_URL.*"/)(${hash}\\.html)(")`,
      'g'
    );
    assetEntity.contents = assetEntity.contents.toString().replace(regexp, `$1${htmlMd5}.html$3`);
  }
  assetsMetadata.push({
    path: htmlOutputName,
    ext: 'html',
  });

  return assetsMetadata;
}
