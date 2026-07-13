import type { PluginPass } from '@babel/core';

export type CacheVaryDim = { scheme: string; name: string };

/**
 * Record that the current file's transform output depends on an ambient value.
 *
 * Babel caches plugin instances across files within a worker, so closure state would leak dims.
 */
export function addCacheVary(pass: PluginPass, dim: CacheVaryDim): void {
  const metadata = pass.file.metadata;
  assertExpoMetadata(metadata);
  const dims = (metadata.cacheVary ??= []);
  if (!dims.some((d) => d.scheme === dim.scheme && d.name === dim.name)) {
    dims.push(dim);
  }
}

function assertExpoMetadata(metadata: any): asserts metadata is {
  cacheVary?: CacheVaryDim[];
} {
  if (!metadata || typeof metadata !== 'object') {
    throw new Error('Expected Babel state.file.metadata to be an object');
  }
}
