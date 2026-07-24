import type { CacheStore } from '@expo/metro/metro-cache';
import crypto from 'node:crypto';

import { LruCache } from './LruCache';
import {
  canonicalDims,
  canonicalDimNames,
  currentFingerprint,
  dimId,
  type CacheVaryDim,
  type EmbeddedVaryDim,
} from './ambient';

export type { AmbientVaryScheme } from './ambient';

const debug = require('debug')('expo:metro:cache-vary') as typeof console.log;

const VARY_REGISTRY_VERSION = 1;
const OBSERVATION_LIMIT = 1_000;
const REGISTRY_TAG = 'expoVaryHead';

type NameSetId = string;

interface NameSetLookup {
  ids: Set<NameSetId>;
  dimNameSets: CacheVaryDim[][];
}

interface VaryRegistry<T> {
  expoVaryHead: typeof VARY_REGISTRY_VERSION;
  value: T;
  nameSets: CacheVaryDim[][];
}

export class VaryingCacheStore<T> implements CacheStore<T> {
  #inner: CacheStore<T>;
  #knownNameSetIdsByKey = new LruCache<string, Set<NameSetId> | null>(OBSERVATION_LIMIT);

  constructor(inner: CacheStore<T>) {
    this.#inner = inner;
  }

  async get(key: Buffer): Promise<T | null> {
    const stored = await this.#inner.get(key);
    try {
      const registry = readVaryRegistry<T>(stored);
      if (registry == null) {
        this.#knownNameSetIdsByKey.set(key.toString('hex'), null);
        return null;
      }
      const { value, nameSets } = registry;
      const baseDims = embeddedVaryDims(value);
      if (!baseDims.length && !nameSets.length) return value;

      let currentBaseDims: EmbeddedVaryDim[] | null = null;
      if (baseDims.length) {
        currentBaseDims = await this.#currentDims(baseDims);
        if (currentBaseDims && sameDims(baseDims, currentBaseDims)) return value;
      }

      const { ids, dimNameSets } = collectNameSets(baseDims, nameSets);
      if (currentBaseDims) {
        const variant = await this.#readVariant(key, currentBaseDims);
        if (variant != null) return variant;
      }

      const variant = await this.#findVariant(key, dimNameSets, currentBaseDims ? 1 : 0);
      if (variant != null) return variant;

      if (nameSets.some((set) => set.length === 0)) {
        const variant = await this.#readVariant(key, []);
        if (variant != null) return variant;
      }
      if (!baseDims.length) return value;

      this.#knownNameSetIdsByKey.set(key.toString('hex'), ids);
      return null;
    } catch {
      return null;
    }
  }

  async set(key: Buffer, value: T): Promise<void> {
    const data = (value as any)?.output?.[0]?.data;

    if (data?.css?.skipCache) {
      return this.#inner.set(key, value);
    }

    const hex = key.toString('hex');
    let knownNameSetIds = this.#knownNameSetIdsByKey.get(hex);
    if (knownNameSetIds === undefined) {
      knownNameSetIds = await this.#readBaseNameSetIds(key);
    } else {
      this.#knownNameSetIdsByKey.delete(hex);
    }

    if (knownNameSetIds === null) {
      return this.#inner.set(key, value);
    }

    const dims: EmbeddedVaryDim[] = Array.isArray(data?.expoCacheVary) ? data.expoCacheVary : [];
    const nameSetId = canonicalDimNames(dims);
    if (knownNameSetIds.has(nameSetId)) {
      await this.#inner.set(variantKey(key, dims), value);
    } else {
      await this.#registerNameSet(key, value, dims);
    }
  }

  async #readBaseNameSetIds(key: Buffer): Promise<Set<NameSetId> | null> {
    const registry = readVaryRegistry<T>(await this.#inner.get(key));
    if (registry == null) return null;
    return collectNameSets(embeddedVaryDims(registry.value), registry.nameSets).ids;
  }

  async #registerNameSet(key: Buffer, value: T, dims: EmbeddedVaryDim[]): Promise<void> {
    // Blob before registry prevents a dangling registered name set.
    await this.#inner.set(variantKey(key, dims), value);
    const current = await this.#inner.get(key);
    const registry = readVaryRegistry<T>(current);
    if (registry == null) {
      await this.#inner.set(key, value);
      return;
    }
    const dimNames: CacheVaryDim[] = dims.map(({ scheme, name }) => ({
      scheme,
      name,
    }));
    const nameSets = mergeNameSets(embeddedVaryDims(registry.value), registry.nameSets, dimNames);
    debug(
      'cache-vary dim names changed under one cache key (producer bug or version skew) — registering name set: [%s]',
      dimNames.map(dimId).join(',')
    );
    const nextRegistry: VaryRegistry<T> = {
      expoVaryHead: VARY_REGISTRY_VERSION,
      value: registry.value,
      nameSets,
    };
    await this.#inner.set(key, nextRegistry as T);
  }

  async #findVariant(
    key: Buffer,
    dimNameSets: CacheVaryDim[][],
    startIndex = 0
  ): Promise<T | null> {
    for (let i = startIndex; i < dimNameSets.length; i++) {
      const names = dimNameSets[i]!;
      const dims = await this.#currentDims(names);
      if (!dims) continue;
      const variant = await this.#readVariant(key, dims);
      if (variant != null) return variant;
    }
    return null;
  }

  async #readVariant(key: Buffer, dims: EmbeddedVaryDim[]): Promise<T | null> {
    const variant = await this.#inner.get(variantKey(key, dims));
    return isRawArtifact(variant) ? (variant as T) : null;
  }

  async #currentDims(names: CacheVaryDim[]): Promise<EmbeddedVaryDim[] | null> {
    const ownDims: EmbeddedVaryDim[] = [];
    for (const { scheme, name } of names) {
      const fp = await currentFingerprint(scheme, name);
      if (fp == null) return null;
      ownDims.push({ scheme, name, fp });
    }
    return ownDims;
  }

  clear(): void | Promise<void> {
    this.#knownNameSetIdsByKey.clear();
    return this.#inner.clear();
  }
}

function readVaryRegistry<T>(stored: unknown): { value: T; nameSets: CacheVaryDim[][] } | null {
  if (stored == null) return null;
  if (!hasRegistryTag(stored)) return { value: stored as T, nameSets: [] };
  const registry = stored as Partial<VaryRegistry<T>>;
  if (
    registry.expoVaryHead !== VARY_REGISTRY_VERSION ||
    !('value' in registry) ||
    !Array.isArray(registry.nameSets)
  ) {
    return null;
  }
  return { value: registry.value as T, nameSets: registry.nameSets };
}

function hasRegistryTag(stored: unknown): boolean {
  return typeof stored === 'object' && stored != null && REGISTRY_TAG in stored;
}

function isRawArtifact<T>(value: T | null): value is T {
  return value != null && !hasRegistryTag(value);
}

function embeddedVaryDims(value: unknown): EmbeddedVaryDim[] {
  const dims = (value as any)?.output?.[0]?.data?.expoCacheVary;
  return Array.isArray(dims) ? dims : [];
}

function collectNameSets(baseNames: CacheVaryDim[], nameSets: CacheVaryDim[][]): NameSetLookup {
  const ids = new Set<NameSetId>();
  const dimNameSets: CacheVaryDim[][] = [];
  for (const names of [baseNames, ...nameSets]) {
    const canonical = canonicalDimNames(names);
    if (ids.has(canonical)) continue;
    ids.add(canonical);
    if (names.length) dimNameSets.push(names);
  }
  return { ids, dimNameSets };
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

function sameDims(a: EmbeddedVaryDim[], b: EmbeddedVaryDim[]): boolean {
  return canonicalDims(a) === canonicalDims(b);
}
