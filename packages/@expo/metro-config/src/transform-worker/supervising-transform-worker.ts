import type { JsTransformerConfig, JsTransformOptions } from '@expo/metro/metro-transform-worker';
import BuiltinModule from 'module';

import * as worker from './metro-transform-worker';
import type { TransformResponse } from './transform-worker';
import { createStickyModuleMapper } from './utils/moduleMapper';

const defaultTransformer: typeof import('./transform-worker') = require('./transform-worker');

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

const STICKY_PACKAGES = [
  'metro',
  'metro-babel-transformer',
  'metro-cache',
  'metro-cache-key',
  'metro-config',
  'metro-core',
  'metro-file-map',
  'metro-resolver',
  'metro-runtime',
  'metro-source-map',
  'metro-transform-plugins',
  'metro-transform-worker',
  '@expo/metro-config',
  '@expo/metro',
];

const debug = require('debug')(
  'expo:metro-config:supervising-transform-worker'
) as typeof console.log;

let _initModuleInterceptDone = false;

const initModuleIntercept = (moduleNames: string[]) => {
  if (_initModuleInterceptDone) {
    return;
  }
  _initModuleInterceptDone = true;
  const Module: typeof BuiltinModule =
    module.constructor.length > 1 ? (module.constructor as any) : BuiltinModule;
  const originalResolveFilename = Module._resolveFilename;
  const stickyModuleMapper = createStickyModuleMapper(moduleNames);
  Module._resolveFilename = function (request, parent, isMain, options) {
    const parentId = typeof parent === 'string' ? parent : parent?.id;
    const redirectedRequest = stickyModuleMapper(request, parentId);
    if (redirectedRequest) {
      try {
        const resolution = require.resolve(redirectedRequest);
        debug(`Redirected request "${request}" -> "${redirectedRequest}"`);
        return resolution;
      } catch (error) {
        debug(`Could not redirect request "${request}": ${error}`);
      }
    }
    return originalResolveFilename.call(this, request, parent, isMain, options);
  };
};

const getCustomTransform = (() => {
  let _transformerPath: string | undefined;
  let _transformer: typeof import('./transform-worker') | undefined;
  return (config: JsTransformerConfig) => {
    if (_transformer == null && _transformerPath == null) {
      _transformerPath = config.expo_customTransformerPath;
    } else if (
      config.expo_customTransformerPath != null &&
      _transformerPath !== config.expo_customTransformerPath
    ) {
      throw new Error('expo_customTransformerPath must not be modified after initialization');
    }
    initModuleIntercept(STICKY_PACKAGES);
    if (_transformer == null && _transformerPath != null) {
      debug(`Loading custom transformer at "${_transformerPath}"`);
      try {
        _transformer = require.call(null, _transformerPath);
      } catch (error: any) {
        throw new Error(
          `Your custom Metro transformer has failed to initialize. Check: "${_transformerPath}"\n` +
            (typeof error.message === 'string' ? error.message : `${error}`)
        );
      }
    }
    return _transformer;
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
  const customWorker = getCustomTransform(config) ?? defaultTransformer;
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
