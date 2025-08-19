import type { JsTransformerConfig, JsTransformOptions } from '@expo/metro/metro-transform-worker';

import * as worker from './metro-transform-worker';
import type { TransformResponse } from './transform-worker';

declare module '@expo/metro/metro-transform-worker' {
  export interface JsTransformerConfig {
    expo_customTransformerPath?: string;
  }
}

const debug = require('debug')(
  'expo:metro-config:supervising-transform-worker'
) as typeof console.log;

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
