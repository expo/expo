import path from 'path';

import { createModuleMapper } from './moduleMapper';

export { default as getMinifier } from '@expo/metro/metro-transform-worker/utils/getMinifier';

export function resolveMinifier(request: string) {
  // We have to imitate how `getMinifier` resolves the minifier
  // It does so by requiring the `minifierPath` from the `metro-transform-worker/utils/getMinifier` base path
  // This means that when we're trying to resolve the minifier, we need to redirect the resolution to `metro-transform-worker`
  const moduleMapper = createModuleMapper();
  const metroTransformWorkerPath = moduleMapper('metro-transform-worker/package.json');
  if (metroTransformWorkerPath) {
    try {
      return require.resolve(request, {
        paths: [path.dirname(metroTransformWorkerPath)],
      });
    } catch (error: any) {
      if (error.code !== 'MODULE_NOT_FOUND') {
        throw error;
      }
    }
  }

  return require.resolve(request);
}
