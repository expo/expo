import {
  VaryingCacheStore,
  type AmbientVaryScheme,
} from '@expo/metro-config/build/cache-vary/VaryingCacheStore';
import type { ConfigT as MetroConfig } from '@expo/metro/metro-config';
import type Bundler from '@expo/metro/metro/Bundler';
import DeltaCalculator from '@expo/metro/metro/DeltaBundler/DeltaCalculator';
import crypto from 'node:crypto';

import { env } from '../../../utils/env';

const debug = require('debug')('expo:metro:cache-vary') as typeof console.log;

interface ObservedAmbientValue {
  scheme: AmbientVaryScheme;
  name: string;
  value: string | undefined;
}

interface EmbeddedVaryDim {
  scheme: string;
  name: string;
  fp: string;
}

type CacheVaryPatchedBundler = Bundler & {
  __expoCacheVaryTransformFilePatched?: boolean;
};

// Duplicated from `@expo/metro-config/src/cache-vary/ambient.ts`.
function readAmbientVaryValue(scheme: AmbientVaryScheme, name: string): string | undefined {
  switch (scheme) {
    case 'env':
      return process.env[name];
  }
}

const isAmbientVaryScheme = (scheme: string): scheme is AmbientVaryScheme => scheme === 'env';

const dimId = (dim: { scheme: string; name: string }): string => `${dim.scheme}:${dim.name}`;

const embeddedVaryDims = (value: unknown): EmbeddedVaryDim[] | undefined => {
  const dims = (value as any)?.output?.[0]?.data?.expoCacheVary;
  return Array.isArray(dims) && dims.length > 0 ? dims : undefined;
};

const _observedAmbientValues = new Map<string, ObservedAmbientValue>();

export function withMetroCacheVary(config: MetroConfig): MetroConfig {
  if (env.EXPO_NO_CACHE_VARY) {
    return config;
  } else {
    return {
      ...config,
      cacheStores: (config.cacheStores ?? []).map((store) =>
        store instanceof VaryingCacheStore ? store : new VaryingCacheStore(store)
      ),
    };
  }
}

export function resetAmbientValueTracking(): void {
  _observedAmbientValues.clear();
}

export function patchTransformFileForCacheVary(bundler: Bundler): void {
  if (env.EXPO_NO_CACHE_VARY) return;

  const patchedBundler = bundler as CacheVaryPatchedBundler;
  if (patchedBundler.__expoCacheVaryTransformFilePatched) return;
  patchedBundler.__expoCacheVaryTransformFilePatched = true;

  const originalTransformFile = patchedBundler.transformFile.bind(patchedBundler);
  patchedBundler.transformFile = async (...args: Parameters<Bundler['transformFile']>) => {
    let result = await originalTransformFile(...args);

    const dims = embeddedVaryDims(result);
    if (!dims) {
      return result;
    }

    for (const dim of dims) {
      if (isAmbientVaryScheme(dim.scheme)) {
        _observedAmbientValues.set(dimId(dim), {
          scheme: dim.scheme,
          name: dim.name,
          value: readAmbientVaryValue(dim.scheme, dim.name),
        });
      }
    }

    if (result.unstable_transformResultKey != null) {
      const varyHash = crypto
        .createHash('sha1')
        .update(
          dims
            .map((d) => `${dimId(d)}=${d.fp}`)
            .sort()
            .join('\n')
        )
        .digest('hex');
      result = {
        ...result,
        unstable_transformResultKey: `${result.unstable_transformResultKey}::${varyHash}`,
      };
    }

    return result;
  };
}

interface CacheVaryDeltaCalculator extends DeltaCalculator<unknown> {
  _expoSeenAmbient?: Map<string, string | undefined>;
}

export function patchGetDeltaForCacheVary(): void {
  if (env.EXPO_NO_CACHE_VARY) return;

  const proto = DeltaCalculator.prototype as any;
  if (proto.__expoVaryPatched) {
    return;
  } else {
    proto.__expoVaryPatched = true;
  }

  const getDelta = proto.getDelta;
  proto.getDelta = async function _getDelta(
    this: CacheVaryDeltaCalculator,
    options: {
      reset: boolean;
      shallow: boolean;
    }
  ) {
    const modifiedAmbientDims = new Set<string>();

    try {
      const seen = (this._expoSeenAmbient ??= new Map());
      for (const [id, observed] of _observedAmbientValues) {
        if (!seen.has(id)) {
          seen.set(id, observed.value);
        }
        const current = readAmbientVaryValue(observed.scheme, observed.name);
        if (seen.get(id) !== current) {
          modifiedAmbientDims.add(id);
          seen.set(id, current);
        }
      }
    } catch {
      // Delta scans must not fail builds.
    }

    if (modifiedAmbientDims.size && this._graph.dependencies != null) {
      const dependencies = this._graph.dependencies;
      for (const [path, module] of dependencies) {
        const dims = embeddedVaryDims(module);
        if (dims?.some((dim) => modifiedAmbientDims.has(dimId(dim)))) {
          debug('Ambient value changed, marking module for re-transform: %s', path);
          this._modifiedFiles.add(path);
        }
      }
    }

    return getDelta.call(this, options);
  };
}
