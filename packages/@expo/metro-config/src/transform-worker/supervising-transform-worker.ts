import type { JsTransformerConfig, JsTransformOptions } from '@expo/metro/metro-transform-worker';
import path from 'path';

import * as worker from './metro-transform-worker';
import type { TransformResponse } from './transform-worker';
import { patchNodeModuleResolver } from './utils/moduleMapper';

const defaultTransformer: typeof import('./transform-worker') = require('./transform-worker');
const defaultTransformerPath = require.resolve('./transform-worker');

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
  return (config: JsTransformerConfig, projectRoot: string) => {
    // The user's original `transformerPath` is stored on `config.transformer.expo_customTransformerPath`
    // by @expo/cli in `withMetroSupervisingTransformWorker()`
    if (_transformer == null && _transformerPath == null) {
      _transformerPath = config.expo_customTransformerPath;
    } else if (
      config.expo_customTransformerPath != null &&
      _transformerPath !== config.expo_customTransformerPath
    ) {
      throw new Error('expo_customTransformerPath must not be modified after initialization');
    }

    // We override require calls in the user transformer to use *our* version
    // of Metro and this version of @expo/metro-config forcefully.
    // Versions of Metro must be aligned to the ones that Expo is using
    // This is done by patching Node.js' module resolution function
    patchNodeModuleResolver();

    if (
      _transformer == null &&
      _transformerPath != null &&
      _transformerPath !== defaultTransformerPath
    ) {
      // We only load the user transformer once and cache it
      // If the user didn't add a custom transformer, we don't load it,
      // but the user maybe has a custom Babel transformer
      debug(`Loading custom transformer at "${_transformerPath}"`);
      try {
        _transformer = require.call(null, _transformerPath);
      } catch (error: any) {
        // If the user's transformer throws and fails initialization, we customize the
        // error and output a path to the user to clarify that it's the transformer that
        // failed to initialize
        const relativeTransformerPath = path.relative(projectRoot, _transformerPath);
        throw new Error(
          `Your custom Metro transformer has failed to initialize. Check: "${relativeTransformerPath}"\n` +
            (typeof error.message === 'string' ? error.message : `${error}`)
        );
      }
    }
    return _transformer;
  };
})();

export function transform(
  config: JsTransformerConfig,
  projectRoot: string,
  filename: string,
  data: Buffer,
  options: JsTransformOptions
): Promise<TransformResponse> {
  const customWorker = getCustomTransform(config, projectRoot) ?? defaultTransformer;
  // Delete this custom property before we call the custom transform worker
  // The supervising-transform-worker should be transparent, and the user's transformer
  // shouldn't know it's been called by it
  if (config.expo_customTransformerPath != null) {
    config.expo_customTransformerPath = undefined;
  }
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
