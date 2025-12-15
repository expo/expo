import type { ConfigT as MetroConfig } from '@expo/metro/metro-config';
import { unstable_transformerPath, internal_supervisingTransformerPath } from '@expo/metro-config';

const debug = require('debug')(
  'expo:metro:withMetroSupervisingTransformWorker'
) as typeof console.log;

declare module '@expo/metro/metro-transform-worker' {
  export interface JsTransformerConfig {
    expo_customTransformerPath?: string | false;
  }
}

// The default babel transformer is either `@expo/metro-config/babel-transformer` set by the user
// or @expo/metro-config/build/babel-transformer
const defaultBabelTransformerPaths = [
  require.resolve('@expo/metro-config/babel-transformer'),
  require.resolve('@expo/metro-config/build/babel-transformer'),
];

/** Adds a wrapper around a user's transformerPath or babelTransformerPath
 * @remarks
 * It's relatively common still for people to set custom transformerPath
 * or babelTransformerPaths. These are used to customize how files are transformed
 * and wrap around Expo's transformer/babel-transformer.
 *
 * This config override customizes them.
 * If a user has a custom transformer or babelTransformerPath set, we
 * first load the "supervising transformer"
 *
 * This is a transformer entrypoint that's always supposed to load first and
 * loads the user's custom transformer from `config.transformer.expo_customTransformerPath`
 * instead of `config.transformerPath`
 *
 * This supervisor has two tasks:
 * - It adds a try-catch. When the user's transformer fails to load, we output a better error message
 * - It forces the same versions of Metro and @expo/metro-config to load that we depend on
 *   (unless threading is disabled, which makes this override unsafe)
 *
 * We do this because transformers and babel transformers *must not* use different
 * versions of Metro. This is unsupported and undefined behavior and will lead to
 * bugs and errors.
 */
export function withMetroSupervisingTransformWorker(config: MetroConfig): MetroConfig {
  // NOTE: This is usually a required property, but we don't always set it in mocks
  const originalBabelTransformerPath = config.transformer?.babelTransformerPath;
  const originalTransformerPath = config.transformerPath;

  const hasDefaultTransformerPath = originalTransformerPath === unstable_transformerPath;
  const hasDefaultBabelTransformerPath =
    !originalBabelTransformerPath ||
    defaultBabelTransformerPaths.includes(originalBabelTransformerPath);
  if (hasDefaultTransformerPath && hasDefaultBabelTransformerPath) {
    return config;
  }

  // DEBUGGING: When set to false the supervisor is disabled for debugging
  if (config.transformer?.expo_customTransformerPath === false) {
    debug('Skipping transform worker supervisor: transformer.expo_customTransformerPath is false');
    return config;
  }

  // We modify the config if the user either has a custom transformerPath or
  // a custom transformer.babelTransformerPath
  // NOTE: It's not a bad thing if we load the superivising transformer even if
  // we don't need to. It will do nothing to our transformer
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
