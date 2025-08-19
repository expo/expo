import type { ConfigT as MetroConfig } from '@expo/metro/metro-config';
import { unstable_transformerPath, internal_supervisingTransformerPath } from '@expo/metro-config';

const debug = require('debug')(
  'expo:metro:withMetroSupervisingTransformWorker'
) as typeof console.log;

declare module '@expo/metro/metro-transform-worker' {
  export interface JsTransformerConfig {
    expo_customTransformerPath?: string;
  }
}

const defaultBabelTransformerPaths = [
  require.resolve('@expo/metro-config/babel-transformer'),
  require.resolve('@expo/metro-config/build/babel-transformer'),
];

export function withMetroSupervisingTransformWorker(config: MetroConfig): MetroConfig {
  const originalTransformerPath = config.transformerPath;
  const originalBabelTransformerPath = config.transformer?.babelTransformerPath;

  const hasDefaultTransformerPath = originalTransformerPath === unstable_transformerPath;
  const hasDefaultBabelTransformerPath =
    !originalBabelTransformerPath ||
    defaultBabelTransformerPaths.includes(originalBabelTransformerPath);
  if (hasDefaultTransformerPath && hasDefaultBabelTransformerPath) {
    return config;
  }

  if (!hasDefaultTransformerPath) {
    debug('Detected customized "transformerPath"');
  }
  if (!hasDefaultBabelTransformerPath) {
    debug('Detected customized "transformer.babelTransformerPath"');
  }

  debug('Applying transform worker supervisor to "transformerPath"');
  return {
    ...config,
    transformerPath: internal_supervisingTransformerPath,
    transformer: {
      ...config.transformer,
      // Only pass the custom transformer path, if the user has set one, otherwise we're only applying
      // the supervisor for the Babel transformer
      expo_customTransformerPath: !hasDefaultTransformerPath ? originalTransformerPath : undefined,
    },
  };
}
