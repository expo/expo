import type { DefinedNativePlugin } from 'noxcturnal';

import type { CacheVaryDim } from '../../../cache-vary/ambient';
import { expoPluginData, type Noxcturnal } from '../noxcturnal-transformer';

export function addCacheVary(context: { pluginData: unknown }, dim: CacheVaryDim): void {
  const dims = expoPluginData(context).cacheVary;
  if (!dims.some((item) => item.scheme === dim.scheme && item.name === dim.name)) {
    dims.push(dim);
  }
}

export function createCacheVaryMetadataPlugin(
  nox: Noxcturnal
): DefinedNativePlugin<Record<string, never>> {
  return nox.defineNativePlugin({
    name: 'expo-cache-vary-metadata',
    contract: {
      metadata: { writes: ['cacheVary'] },
    },
    post(context) {
      const dims = expoPluginData(context).cacheVary;
      if (dims.length > 0) {
        context.metadata.set('cacheVary', dims);
      }
    },
  });
}
