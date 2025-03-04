import type { ExpoConfig } from '@expo/config';
import assert from 'assert';
import crypto from 'crypto';
import path from 'path';
import resolveFrom from 'resolve-from';
import url from 'url';

import { type PlatformMetadata } from './createMetadataJson';
import { type BundleOutput, type ExportAssetMap, getFilesFromSerialAssets } from './saveAssets';
import { type MetroBundlerDevServer } from '../start/server/metro/MetroBundlerDevServer';
import { serializeHtmlWithAssets } from '../start/server/metro/serializeHtml';
import {
  getDomComponentHtml,
  DOM_COMPONENTS_BUNDLE_DIR,
} from '../start/server/middleware/DomComponentsMiddleware';
import { env } from '../utils/env';
import { resolveRealEntryFilePath, toPosixPath } from '../utils/filePath';

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
  useMd5Filename = false,
}: {
  filePath: string;
  projectRoot: string;
  dev: boolean;
  devServer: MetroBundlerDevServer;
  isHermes: boolean;
  includeSourceMaps: boolean;
  exp: ExpoConfig;
  files: ExportAssetMap;
  useMd5Filename?: boolean;
}): Promise<{
  bundle: BundleOutput;
  htmlOutputName: string;
}> {
  const virtualEntry = toPosixPath(resolveFrom(projectRoot, 'expo/dom/entry.js'));
  debug('Bundle DOM Component:', filePath);
  // MUST MATCH THE BABEL PLUGIN!
  const hash = crypto.createHash('md5').update(filePath).digest('hex');
  const outputName = `${DOM_COMPONENTS_BUNDLE_DIR}/${hash}.html`;
  const generatedEntryPath = toPosixPath(
    filePath.startsWith('file://') ? url.fileURLToPath(filePath) : filePath
  );
  const baseUrl = `/${DOM_COMPONENTS_BUNDLE_DIR}`;
  // The relative import path will be used like URI so it must be POSIX.
  const relativeImport = './' + path.posix.relative(path.dirname(virtualEntry), generatedEntryPath);
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
    useMd5Filename,
    // Minify may be false because it's skipped on native when Hermes is enabled, default to true.
    minify: true,
  });

  if (useMd5Filename) {
    for (const artifact of bundle.artifacts) {
      const md5 = crypto.createHash('md5').update(artifact.source).digest('hex');
      artifact.filename = `${md5}.${artifact.type}`;
    }
  }

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

//#region `npx export` for updates

/**
 * Add the DOM component bundle to the metadata for updates.
 */
export function addDomBundleToMetadataAsync(bundle: BundleOutput): PlatformMetadata['assets'] {
  const assetsMetadata: PlatformMetadata['assets'] = [];
  for (const artifact of bundle.artifacts) {
    if (artifact.type === 'map') {
      continue;
    }
    assetsMetadata.push({
      path: `${DOM_COMPONENTS_BUNDLE_DIR}/${artifact.filename}`,
      ext: artifact.type,
    });
  }
  return assetsMetadata;
}

/**
 * Post-transform the native bundle to use MD5 filename based on DOM component entry content.
 */
export function transformNativeBundleForMd5FilenameAsync({
  domComponentReference,
  nativeBundle,
  files,
  htmlOutputName,
}: {
  domComponentReference: string;
  nativeBundle: BundleOutput;
  files: ExportAssetMap;
  htmlOutputName: string;
}) {
  const htmlContent = files.get(htmlOutputName);
  assert(htmlContent);
  const htmlMd5 = crypto.createHash('md5').update(htmlContent.contents.toString()).digest('hex');
  const hash = crypto.createHash('md5').update(domComponentReference).digest('hex');
  for (const artifact of nativeBundle.artifacts) {
    if (artifact.type !== 'js') {
      continue;
    }
    const assetEntity = files.get(artifact.filename);
    assert(assetEntity);
    if (Buffer.isBuffer(assetEntity.contents)) {
      const searchBuffer = Buffer.from(`${hash}.html`, 'utf8');
      const replaceBuffer = Buffer.from(`${htmlMd5}.html`, 'utf8');
      assert(searchBuffer.length === replaceBuffer.length);
      let index = assetEntity.contents.indexOf(searchBuffer, 0);
      while (index !== -1) {
        replaceBuffer.copy(assetEntity.contents, index);
        index = assetEntity.contents.indexOf(searchBuffer, index + searchBuffer.length);
      }
    } else {
      const search = `${hash}.html`;
      const replace = `${htmlMd5}.html`;
      assert(search.length === replace.length);
      assetEntity.contents = assetEntity.contents.toString().replaceAll(search, replace);
    }
  }
}

//#endregion `npx export` for updates
