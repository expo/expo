import type { CacheStore } from '@expo/metro/metro-cache';
import crypto from 'node:crypto';

import { LruCache } from './LruCache';
import {
  canonicalDims,
  canonicalDimNames,
  currentFingerprint,
  type CacheVaryDim,
  type EmbeddedVaryDim,
} from './ambient';

export type { AmbientVaryScheme } from './ambient';

const VARY_REGISTRY_VERSION = 1;
const OBSERVATION_LIMIT = 1_000;
const REGISTRY_TAG = 'expoVaryHead';
const NO_NAME_SETS: CacheVaryDim[][] = [];
const NO_DIMS: EmbeddedVaryDim[] = [];

type NameSetId = string;

type TransformResultLike = {
  output?: { data?: { css?: { skipCache?: boolean }; expoCacheVary?: unknown } }[];
};

const VACANT_BASE = Symbol('vacantBase');
type ObservedBase = typeof VACANT_BASE | Set<NameSetId>;

interface VaryRegistry<T> {
  expoVaryHead: typeof VARY_REGISTRY_VERSION;
  value: T;
  nameSets: CacheVaryDim[][];
}

/**
 * A cache-store decorator that keeps transform results separate when they depend on ambient
 * values such as environment variables.
 *
 * @remarks
 * Metro supplies a cache key for a transform. The first result for that key is stored unchanged in
 * the base slot at that key. The result's `expoCacheVary` metadata records the ambient names that
 * affected the transform and the fingerprints of their values at transform time.
 *
 * On a read, this store recomputes the fingerprints for those names. If they match, it returns the
 * base result with one store read. If they differ, it derives a variant key from Metro's key and
 * the current fingerprints, then reads the matching result from that key. Each distinct set of
 * ambient values can therefore have its own cached transform.
 *
 * A transform should consistently report the same ambient names for one Metro key. If it does not,
 * this store wraps the base result in a small registry containing the other reported name sets.
 * Reads try those name sets as fallbacks. This preserves cache entries produced by different
 * versions or by a producer that violated the name-set contract.
 *
 * Metro normally follows a cache miss with a write. A small in-memory LRU carries the observed base
 * state between those calls, avoiding another base read. It is only an optimization: if the
 * observation is missing or evicted, `set()` derives the same state from the stored base value.
 *
 * @typeParam T - The value type accepted by the wrapped Metro cache store.
 */
export class VaryingCacheStore<T> implements CacheStore<T> {
  #inner: CacheStore<T>;
  #observedBasesByKey = new LruCache<string, ObservedBase>(OBSERVATION_LIMIT);

  constructor(inner: CacheStore<T>) {
    this.#inner = inner;
  }

  async get(key: Buffer): Promise<T | null> {
    const stored = await this.#inner.get(key);
    if (stored == null) {
      this.#rememberBase(key, VACANT_BASE);
      return null;
    }

    const registry = readVaryRegistry<T>(stored);
    if (hasRegistryTag(stored) && registry == null) {
      // Do not expose an invalid registry as a transform result.
      this.#rememberBase(key, VACANT_BASE);
      return null;
    }

    const value = registry ? registry.value : stored;
    const nameSets = registry ? registry.nameSets : NO_NAME_SETS;
    const baseDims = readEmbeddedVaryDims(value);
    if (baseDims == null) {
      // Malformed vary metadata is an unusable cache entry, not a build error.
      return null;
    }

    // Try the base value, then any variants described by its registry.
    const resolved = await this.#resolve(key, value, baseDims, nameSets);
    if (resolved != null) {
      return resolved;
    } else {
      // Carry the observed name sets to the write that normally follows this miss.
      this.#rememberBase(key, collectNameSetIds(baseDims, nameSets));
      return null;
    }
  }

  async set(key: Buffer, value: T): Promise<void> {
    const data = (value as TransformResultLike)?.output?.[0]?.data;
    if (data?.css?.skipCache) {
      return this.#inner.set(key, value);
    }

    const observedBase = await this.#takeBaseObservation(key);
    if (observedBase === VACANT_BASE) {
      // The first result claims Metro's normal cache key as the base value.
      return this.#inner.set(key, value);
    }

    const dims: EmbeddedVaryDim[] = Array.isArray(data?.expoCacheVary) ? data.expoCacheVary : [];
    const nameSetId = canonicalDimNames(dims);
    if (observedBase.has(nameSetId)) {
      // Known dimension names can go straight to their fingerprint-derived key.
      await this.#inner.set(variantKey(key, dims), value);
    } else {
      // NOTE(@kitten): A transform is expected to report stable dimension names for a Metro key.
      // Record an unexpected name set so entries from version skew or a producer bug remain usable.
      await this.#registerNameSet(key, value, dims);
    }
  }

  #rememberBase(key: Buffer, observation: ObservedBase): void {
    this.#observedBasesByKey.set(cacheKeyId(key), observation);
  }

  async #takeBaseObservation(key: Buffer): Promise<ObservedBase> {
    const id = cacheKeyId(key);
    const observation = this.#observedBasesByKey.get(id);
    if (observation != undefined) {
      // Observations are consumed by one write; later writes must inspect the base again.
      this.#observedBasesByKey.delete(id);
      return observation;
    }

    const stored = await this.#inner.get(key);
    if (stored == null) {
      return VACANT_BASE;
    }

    const registry = readVaryRegistry<T>(stored);
    if (hasRegistryTag(stored) && registry == null) {
      // A later write can replace an invalid base entry with a valid result.
      return VACANT_BASE;
    }

    const value = registry ? registry.value : stored;
    const baseDims = readEmbeddedVaryDims(value);
    if (baseDims != null) {
      return collectNameSetIds(baseDims, registry ? registry.nameSets : NO_NAME_SETS);
    } else {
      return VACANT_BASE;
    }
  }

  async #registerNameSet(key: Buffer, value: T, dims: EmbeddedVaryDim[]): Promise<void> {
    // Write the variant first so the registry never points at a value that was not written.
    await this.#inner.set(variantKey(key, dims), value);
    const stored = await this.#inner.get(key);
    const registry = readVaryRegistry<T>(stored);
    if (stored == null || (hasRegistryTag(stored) && registry == null)) {
      // The base disappeared or became invalid while the variant was being written; reclaim it.
      await this.#inner.set(key, value);
      return;
    }
    const baseValue = registry ? registry.value : stored;
    const registeredNameSets = registry ? registry.nameSets : NO_NAME_SETS;
    const dimNames: CacheVaryDim[] = dims.map(({ scheme, name }) => ({
      scheme,
      name,
    }));
    const nameSets = mergeNameSets(embeddedVaryDims(baseValue), registeredNameSets, dimNames);
    // NOTE(@kitten): Reaching this path means transforms for one Metro key unexpectedly reported
    // different dimension names. Keep the base value and record the extra set silently so cache
    // entries from version skew or a producer bug remain resolvable.
    const nextRegistry: VaryRegistry<T> = {
      expoVaryHead: VARY_REGISTRY_VERSION,
      value: baseValue,
      nameSets,
    };
    await this.#inner.set(key, nextRegistry as T);
  }

  async #resolve(
    key: Buffer,
    value: T,
    baseDims: EmbeddedVaryDim[],
    nameSets: CacheVaryDim[][]
  ): Promise<T | null> {
    if (!baseDims.length && !nameSets.length) return value;

    // The value in the base slot is the cheapest hit: it needs no second store read.
    const currentBaseDims = baseDims.length ? await currentDims(baseDims) : null;
    if (currentBaseDims && sameDims(baseDims, currentBaseDims)) {
      return value;
    } else if (currentBaseDims) {
      // The usual miss path uses the same names as the base with different fingerprints.
      const variant = await this.#readVariant(key, currentBaseDims);
      if (variant != null) {
        return variant;
      }
    }

    // NOTE(@kitten): Registered name sets are an exceptional fallback. They only exist when
    // transforms for one Metro key unexpectedly reported different dimension names.
    for (const names of nameSets) {
      if (!names.length) continue;
      const dims = await currentDims(names);
      if (!dims) continue;
      const variant = await this.#readVariant(key, dims);
      if (variant != null) return variant;
    }

    if (nameSets.some((names) => names.length === 0)) {
      // NOTE(@kitten): An empty registered set is the same exceptional case for a transform that
      // unexpectedly reported no varying dimensions.
      const variant = await this.#readVariant(key, []);
      if (variant != null) return variant;
    }
    return baseDims.length ? null : value;
  }

  async #readVariant(key: Buffer, dims: EmbeddedVaryDim[]): Promise<T | null> {
    const variant = await this.#inner.get(variantKey(key, dims));
    return variant != null && !hasRegistryTag(variant) ? variant : null;
  }

  clear(): void | Promise<void> {
    this.#observedBasesByKey.clear();
    return this.#inner.clear();
  }
}

const readVaryRegistry = <T>(stored: unknown): VaryRegistry<T> | null => {
  if (!hasRegistryTag(stored)) {
    return null;
  }
  const registry = stored as VaryRegistry<T>;
  if (
    registry.expoVaryHead !== VARY_REGISTRY_VERSION ||
    !('value' in registry) ||
    !Array.isArray(registry.nameSets) ||
    !registry.nameSets.every(isDimNameSet)
  ) {
    return null;
  } else {
    return registry;
  }
};

const hasRegistryTag = (stored: unknown): boolean =>
  typeof stored === 'object' && stored != null && REGISTRY_TAG in stored;

function readEmbeddedVaryDims(value: unknown): EmbeddedVaryDim[] | null {
  const dims = (value as TransformResultLike)?.output?.[0]?.data?.expoCacheVary;
  if (dims === undefined) return NO_DIMS;
  return Array.isArray(dims) && dims.every(isEmbeddedVaryDim) ? dims : null;
}

function embeddedVaryDims(value: unknown): EmbeddedVaryDim[] {
  return readEmbeddedVaryDims(value) ?? NO_DIMS;
}

function isDimNameSet(value: unknown): value is CacheVaryDim[] {
  return Array.isArray(value) && value.every(isCacheVaryDim);
}

function isCacheVaryDim(value: unknown): value is CacheVaryDim {
  if (typeof value !== 'object' || value == null) return false;
  const dim = value as Partial<CacheVaryDim>;
  return typeof dim.scheme === 'string' && typeof dim.name === 'string';
}

function isEmbeddedVaryDim(value: unknown): value is EmbeddedVaryDim {
  if (typeof value !== 'object' || value == null) {
    return false;
  } else {
    const dim = value as Partial<EmbeddedVaryDim>;
    return (
      typeof dim.scheme === 'string' && typeof dim.name === 'string' && typeof dim.fp === 'string'
    );
  }
}

async function currentDims(names: CacheVaryDim[]): Promise<EmbeddedVaryDim[] | null> {
  const dims: EmbeddedVaryDim[] = [];
  for (const { scheme, name } of names) {
    const fp = await currentFingerprint(scheme, name);
    if (fp == null) return null;
    dims.push({ scheme, name, fp });
  }
  return dims;
}

function collectNameSetIds(baseNames: CacheVaryDim[], nameSets: CacheVaryDim[][]): Set<NameSetId> {
  const ids = new Set<NameSetId>([canonicalDimNames(baseNames)]);
  for (const names of nameSets) {
    ids.add(canonicalDimNames(names));
  }
  return ids;
}

function mergeNameSets(
  baseNames: CacheVaryDim[],
  nameSets: CacheVaryDim[][],
  nextNames: CacheVaryDim[]
): CacheVaryDim[][] {
  const seen = new Set([canonicalDimNames(baseNames)]);
  const merged: CacheVaryDim[][] = [];
  for (const names of [...nameSets, nextNames]) {
    const canonical = canonicalDimNames(names);
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    merged.push(names);
  }
  return merged;
}

function variantKey(key: Buffer, dims: EmbeddedVaryDim[]): Buffer {
  return crypto
    .createHash('sha1')
    .update(key)
    .update('\0expo-vary\0' + canonicalDims(dims))
    .digest();
}

function cacheKeyId(key: Buffer): string {
  return key.toString('hex');
}

function sameDims(a: EmbeddedVaryDim[], b: EmbeddedVaryDim[]): boolean {
  return canonicalDims(a) === canonicalDims(b);
}
