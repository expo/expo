import type { Module } from 'metro';
import { getJsOutput, isJsModule } from 'metro/src/DeltaBundler/Serializers/helpers/js';
import path from 'path';

import { pathToHtmlSafeName } from '../transform-worker/css';
import { hashString } from '../utils/hash';
import { SerialAsset } from './serializerAssets';

export type ReadOnlyDependencies<T = any> = Map<string, Module<T>>;

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

// s = static
const STATIC_EXPORT_DIRECTORY = '_expo/static/css';

export type JSModule = Module<{
  data: {
    code: string;
    map: unknown;
    lineCount: number;
    css?: {
      code: string;
      map: unknown;
      lineCount: number;
    };
  };
  type: 'js/module';
}>;

export function filterJsModules(
  dependencies: ReadOnlyDependencies,
  { processModuleFilter, projectRoot }: Pick<Options, 'projectRoot' | 'processModuleFilter'>
) {
  const assets: JSModule[] = [];

  for (const module of dependencies.values()) {
    if (
      isJsModule(module) &&
      processModuleFilter(module) &&
      getJsOutput(module).type === 'js/module' &&
      path.relative(projectRoot, module.path) !== 'package.json'
    ) {
      assets.push(module as JSModule);
    }
  }
  return assets;
}

export function getCssSerialAssets(
  dependencies: ReadOnlyDependencies,
  { processModuleFilter, projectRoot }: Pick<Options, 'projectRoot' | 'processModuleFilter'>
): SerialAsset[] {
  const assets: SerialAsset[] = [];

  for (const module of filterJsModules(dependencies, { processModuleFilter, projectRoot })) {
    const cssMetadata = getCssMetadata(module);
    if (cssMetadata) {
      const contents = cssMetadata.code;
      const filename = path.join(
        // Consistent location
        STATIC_EXPORT_DIRECTORY,
        // Hashed file contents + name for caching
        fileNameFromContents({
          filepath: module.path,
          src: contents,
        }) + '.css'
      );
      const originFilename = path.relative(projectRoot, module.path);
      assets.push({
        type: 'css',
        originFilename,
        filename,
        source: contents,
        metadata: {
          hmrId: pathToHtmlSafeName(originFilename),
        },
      });
    }
  }

  return assets;
}

function getCssMetadata(module: JSModule): MetroModuleCSSMetadata | null {
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

export function fileNameFromContents({ filepath, src }: { filepath: string; src: string }): string {
  return getFileName(filepath) + '-' + hashString(filepath + src);
}

export function getFileName(module: string) {
  return path.basename(module).replace(/\.[^.]+$/, '');
}
