import type { ExpoConfig } from '@expo/config';
import { convertEntryPointToRelative } from '@expo/config/paths';
import assert from 'assert';
import crypto from 'crypto';
import path from 'path';
import resolveFrom from 'resolve-from';
import url from 'url';

import type { MetroBundlerDevServer } from '../start/server/metro/MetroBundlerDevServer';
import { serializeHtmlWithAssets } from '../start/server/metro/serializeHtml';
import {
  getDomComponentHtml,
  DOM_COMPONENTS_BUNDLE_DIR,
} from '../start/server/middleware/DomComponentsMiddleware';
import { env } from '../utils/env';
import { toPosixPath } from '../utils/filePath';
import type { PlatformMetadata } from './createMetadataJson';
import { debugEvent } from './events';
import { type BundleOutput, type ExportAssetMap, getFilesFromSerialAssets } from './saveAssets';

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
  const virtualEntry = resolveFrom(projectRoot, 'expo/dom/entry.js');
  debugEvent('dom:bundle', { filePath });
  // MUST MATCH THE BABEL PLUGIN!
  const hash = crypto.createHash('md5').update(filePath).digest('hex');
  const outputName = `${DOM_COMPONENTS_BUNDLE_DIR}/${hash}.html`;
  const generatedEntryPath = path.resolve(
    filePath.startsWith('file://') ? url.fileURLToPath(filePath) : filePath
  );
  const baseUrl = `/${DOM_COMPONENTS_BUNDLE_DIR}`;
  // The relative import path will be used like URI so it must be POSIX.
  const relativeImport =
    './' + toPosixPath(path.relative(path.dirname(virtualEntry), generatedEntryPath));
  // Run metro bundler and create the JS bundles/source maps.
  const bundle = await devServer.legacySinglePageExportBundleAsync({
    platform: 'web',
    domRoot: encodeURI(relativeImport),
    splitChunks: !env.EXPO_NO_BUNDLE_SPLITTING,
    mainModuleName: convertEntryPointToRelative(projectRoot, virtualEntry),
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
 * Transform the DOM component entry (*.html) to use MD5 filename by its content.
 */
export function transformDomEntryForMd5Filename({
  files,
  htmlOutputName,
}: {
  files: ExportAssetMap;
  htmlOutputName: string;
}): PlatformMetadata['assets'] {
  const htmlContent = files.get(htmlOutputName);
  assert(htmlContent);
  const htmlMd5 = crypto.createHash('md5').update(htmlContent.contents.toString()).digest('hex');
  const htmlMd5Filename = `${DOM_COMPONENTS_BUNDLE_DIR}/${htmlMd5}.html`;
  files.set(htmlMd5Filename, htmlContent);
  files.delete(htmlOutputName);
  return [
    {
      path: htmlMd5Filename,
      ext: 'html',
    },
  ];
}

/**
 * Post-transform the native bundle to use MD5 filename based on DOM component entry content.
 */
export function transformNativeBundleForMd5Filename({
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
      // Already compiled Hermes bytecode. Sibling chunks without DOM component
      // references (e.g. workers) never contain the html placeholder, so leave
      // them untouched: rewriting bytecode in place is unsound because hermesc
      // overlap-packs strings sharing suffix/prefix bytes, so a same-length
      // replacement can clobber a neighbouring string.
      if (artifact.metadata.expoDomComponentReferences?.length) {
        throw new Error(
          `Cannot rename DOM component asset "${htmlOutputName}" inside the compiled Hermes bytecode of "${artifact.filename}": the chunk was compiled before the rename. ` +
            'This usually means the project resolves a different @expo/metro-config version than @expo/cli (for example, @expo/metro-config installed directly); run `npx expo-doctor` to find the mismatch. ' +
            'Otherwise, it is a bug in Expo CLI: chunks that reference DOM components must be compiled after the rename (see `compileDeferredHermesArtifactsAsync`).'
        );
      }
      continue;
    }
    const search = `${hash}.html`;
    const replace = `${htmlMd5}.html`;
    assert(search.length === replace.length);
    assetEntity.contents = assetEntity.contents.toString().replaceAll(search, replace);
  }
}

//#endregion `npx export` for updates
