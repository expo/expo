import type { Module } from 'metro';
import { getJsOutput, isJsModule } from 'metro/src/DeltaBundler/Serializers/helpers/js';
import path from 'path';

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

export type CSSAsset = {
  // 'styles.css'
  originFilename: string;
  // '_expo/static/css/bc6aa0a69dcebf8e8cac1faa76705756.css'
  filename: string;
  // '\ndiv {\n    background: cyan;\n}\n\n'
  source: string;
};

export function getCssModules(
  dependencies: ReadOnlyDependencies,
  { processModuleFilter, projectRoot }: Pick<Options, 'projectRoot' | 'processModuleFilter'>
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
        promises.push([module.path, contents]);
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
