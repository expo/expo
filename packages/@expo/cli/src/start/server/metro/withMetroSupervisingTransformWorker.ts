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

export function withMetroSupervisingTransformWorker(config: MetroConfig): MetroConfig {
  const originalTransformerPath = config.transformerPath;
  if (originalTransformerPath === unstable_transformerPath) {
    return config;
  }
  debug('Detected customized "transformerPath": Wrapping transformer with supervisor');
  return {
    ...config,
    transformerPath: internal_supervisingTransformerPath,
    transformer: {
      ...config.transformer,
      expo_customTransformerPath: originalTransformerPath,
    },
  };
}
