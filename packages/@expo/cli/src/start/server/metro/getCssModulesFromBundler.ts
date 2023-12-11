import { MetroConfig } from '@expo/metro-config';
import crypto from 'crypto';
import type { Module } from 'metro';
import { getJsOutput, isJsModule } from 'metro/src/DeltaBundler/Serializers/helpers/js';
import type { ReadOnlyDependencies } from 'metro/src/DeltaBundler/types';
import type IncrementalBundler from 'metro/src/IncrementalBundler';
import splitBundleOptions from 'metro/src/lib/splitBundleOptions';
import path from 'path';

type Options = {
  processModuleFilter: (modules: Module) => boolean;
  assetPlugins: readonly string[];
  platform?: string | null;
  projectRoot: string;
  publicPath: string;
};

type MetroModuleCSSMetadata = {
  code: string;
  lineCount: number;
  map: any[];
};

export type CSSAsset = {
  // 'styles.css'
  originFilename: string;
  // '_expo/static/css/bc6aa0a69dcebf8e8cac1faa76705756.css'
  filename: string;
  // '\ndiv {\n    background: cyan;\n}\n\n'
  source: string;
};

// s = static
const STATIC_EXPORT_DIRECTORY = '_expo/static/css';

/** @returns the static CSS assets used in a given bundle. CSS assets are only enabled if the `@expo/metro-config` `transformerPath` is used. */
export async function getCssModulesFromBundler(
  config: MetroConfig,
  incrementalBundler: IncrementalBundler,
  options: any
): Promise<CSSAsset[]> {
  // Static CSS is a web-only feature.
  if (options.platform !== 'web') {
    return [];
  }

  const { entryFile, onProgress, resolverOptions, transformOptions } = splitBundleOptions(options);

  const dependencies = await incrementalBundler.getDependencies(
    [entryFile],
    transformOptions,
    resolverOptions,
    { onProgress, shallow: false }
  );

  return getCssModules(dependencies, {
    processModuleFilter: config.serializer.processModuleFilter,
    assetPlugins: config.transformer.assetPlugins,
    platform: transformOptions.platform,
    projectRoot: config.server.unstable_serverRoot ?? config.projectRoot,
    publicPath: config.transformer.publicPath,
  });
}

function hashString(str: string) {
  return crypto.createHash('md5').update(str).digest('hex');
}

function getCssModules(
  dependencies: ReadOnlyDependencies,
  { processModuleFilter, projectRoot }: Options
) {
  const promises = [];

  for (const module of dependencies.values()) {
    if (
      isJsModule(module) &&
      processModuleFilter(module) &&
      getJsOutput(module).type === 'js/module' &&
      path.relative(projectRoot, module.path) !== 'package.json'
    ) {
      const cssMetadata = getCssMetadata(module);
      if (cssMetadata) {
        const contents = cssMetadata.code;
        const filename = path.join(
          // Consistent location
          STATIC_EXPORT_DIRECTORY,
          // Hashed file contents + name for caching
          getFileName(module.path) + '-' + hashString(module.path + contents) + '.css'
        );
        promises.push({
          originFilename: path.relative(projectRoot, module.path),
          filename,
          source: contents,
        });
      }
    }
  }

  return promises;
}

function getCssMetadata(module: Module): MetroModuleCSSMetadata | null {
  const data = module.output[0]?.data;
  if (data && typeof data === 'object' && 'css' in data) {
    if (typeof data.css !== 'object' || !('code' in (data as any).css)) {
      throw new Error(
        `Unexpected CSS metadata in Metro module (${module.path}): ${JSON.stringify(data.css)}`
      );
    }
    return data.css as MetroModuleCSSMetadata;
  }
  return null;
}

export function getFileName(module: string) {
  return path.basename(module).replace(/\.[^.]+$/, '');
}
