import type { JsTransformerConfig, JsTransformOptions } from '@expo/metro/metro-transform-worker';
import BuiltinModule from 'module';
import path from 'path';

import * as worker from './metro-transform-worker';
import type { TransformResponse } from './transform-worker';

declare module 'module' {
  namespace Module {
    interface ModuleExtensionFunction {
      (module: NodeJS.Module, filename: string): void;
    }
    const _extensions: {
      [ext: string]: ModuleExtensionFunction;
    };
    export function _resolveFilename(
      request: string,
      parent: { id: string; filename: string; paths: string[] } | string | null,
      isMain?: boolean,
      options?: { paths?: string[] }
    ): string;
  }
}

declare module '@expo/metro/metro-transform-worker' {
  export interface JsTransformerConfig {
    expo_customTransformerPath?: string;
  }
}

const STICKY_PACKAGES = ['metro-transform-worker', 'metro', '@expo/metro-config', '@expo/metro'];

const debug = require('debug')(
  'expo:metro-config:supervising-transform-worker'
) as typeof console.log;

const escapeDependencyName = (dependency: string) =>
  dependency.replace(/[*.?()[\]]/g, (x) => `\\${x}`);
const dependenciesToRegex = (dependencies: string[]) =>
  new RegExp(`^(${dependencies.map(escapeDependencyName).join('|')})($|/.*)`);

const moduleRootPaths = [
  path.dirname(require.resolve('../../package.json')),
  path.dirname(require.resolve('@expo/metro/package.json')),
  path.dirname(require.resolve('expo/package.json')),
];

const createStickyModuleMapper = (moduleNames: string[]) => {
  const modulePathMap = moduleNames.reduce(
    (modulePaths, moduleName) => {
      try {
        modulePaths[moduleName] = path.dirname(
          require.resolve(`${moduleName}/package.json`, { paths: moduleRootPaths })
        );
      } catch {
        debug(`Could not resolve module "${moduleNames}"`);
      }
      return modulePaths;
    },
    {} as Record<string, string>
  );
  const moduleTestRe = dependenciesToRegex(Object.keys(modulePathMap));
  return (request: string): string | null => {
    const moduleMatch = moduleTestRe.exec(request);
    if (moduleMatch) {
      const targetModulePath = modulePathMap[moduleMatch[1]];
      if (targetModulePath) {
        return `${targetModulePath}${moduleMatch[2] || ''}`;
      }
    }
    return null;
  };
};

const initModuleIntercept = (moduleNames: string[]) => {
  const Module: typeof BuiltinModule =
    module.constructor.length > 1 ? (module.constructor as any) : BuiltinModule;
  const originalResolveFilename = Module._resolveFilename;
  const stickyModuleMapper = createStickyModuleMapper(moduleNames);
  Module._resolveFilename = function (request, parent, isMain, options) {
    const parentId = typeof parent === 'string' ? parent : parent?.id;
    if (
      !parentId ||
      moduleRootPaths.every((moduleRootPath) => !parentId.startsWith(moduleRootPath))
    ) {
      const redirectedRequest = stickyModuleMapper(request);
      if (redirectedRequest) {
        try {
          const resolution = require.resolve(redirectedRequest);
          debug(`Redirected request "${request}" -> "${redirectedRequest}"`);
          return resolution;
        } catch (error) {
          debug(`Could not redirect request "${request}": ${error}`);
        }
      }
    }
    return originalResolveFilename.call(this, request, parent, isMain, options);
  };
};

const getCustomTransform = (() => {
  let _transformerPath: string | undefined;
  let _transformer: typeof import('./transform-worker') | undefined;
  return (config: JsTransformerConfig) => {
    if (!config.expo_customTransformerPath) {
      throw new Error('expo_customTransformerPath was expected to be set');
    } else if (_transformerPath == null) {
      _transformerPath = config.expo_customTransformerPath;
    } else if (
      config.expo_customTransformerPath != null &&
      _transformerPath !== config.expo_customTransformerPath
    ) {
      throw new Error('expo_customTransformerPath must not be modified');
    }
    if (_transformer == null) {
      debug(`Loading custom transformer at "${_transformerPath}"`);
      try {
        initModuleIntercept(STICKY_PACKAGES);
        _transformer = require.call(null, _transformerPath);
      } catch (error: any) {
        throw new Error(
          `Your custom Metro transformer has failed to initialize. Check: "${_transformerPath}"\n` +
            (typeof error.message === 'string' ? error.message : `${error}`)
        );
      }
    }
    return _transformer!;
  };
})();

const removeCustomTransformPathFromConfig = (config: JsTransformerConfig) => {
  if (config.expo_customTransformerPath != null) {
    config.expo_customTransformerPath = undefined;
  }
};

export function transform(
  config: JsTransformerConfig,
  projectRoot: string,
  filename: string,
  data: Buffer,
  options: JsTransformOptions
): Promise<TransformResponse> {
  const customWorker = getCustomTransform(config);
  removeCustomTransformPathFromConfig(config);
  return customWorker.transform(config, projectRoot, filename, data, options);
}

module.exports = {
  // Use defaults for everything that's not custom.
  ...worker,

  // We ensure that core utilities are never replaced
  applyImportSupport: worker.applyImportSupport,
  getCacheKey: worker.getCacheKey,
  collectDependenciesForShaking: worker.collectDependenciesForShaking,
  minifyCode: worker.minifyCode,

  transform,
};
