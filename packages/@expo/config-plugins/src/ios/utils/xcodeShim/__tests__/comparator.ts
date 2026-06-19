import { parse } from '@bacons/xcode/json';

import { normalizeResult, normalizeUuids } from './normalize';

interface Graph {
  objects: Record<string, any>;
  rootObject: string;
}

export interface Diff {
  equal: boolean;
  /** Dotted path to the first divergence (only when `equal` is false). */
  path?: string;
  legacy?: unknown;
  shim?: unknown;
}

const EQUAL: Diff = { equal: true };

// A reference is any string value that names an object in the graph. Detecting
// refs by membership (not by UUID charset) is robust to both legacy's hex UUIDs
// and `@bacons`'s `XX…XX` content-hash UUIDs.
function isRef(value: unknown, objects: Record<string, any>): value is string {
  return typeof value === 'string' && value in objects;
}

function isRefKeyedDict(value: any, objects: Record<string, any>): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((k) => k in objects);
}

function stableStringify(value: any): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

/**
 * UUID-independent structural fingerprint. References (bare UUIDs / arrays of
 * UUIDs / UUID-keyed dicts) are resolved to the fingerprint of what they point
 * to, so legacy's random UUIDs and `@bacons`'s content-hash UUIDs compare equal
 * as long as the graph structure matches. Cycles (e.g. `containerPortal` back to
 * the root project) collapse to an isa marker.
 */
function fingerprint(value: any, objects: Record<string, any>, stack: Set<string>): any {
  if (isRef(value, objects)) {
    if (stack.has(value)) return { __cycle: objects[value]?.isa ?? true };
    const next = new Set(stack).add(value);
    return { __ref: fingerprintObject(objects[value], objects, next) };
  }
  if (Array.isArray(value)) {
    return value.map((entry) => fingerprint(entry, objects, stack));
  }
  if (value && typeof value === 'object') {
    if (isRefKeyedDict(value, objects)) {
      const pairs = Object.entries(value).map(([k, v]) => [
        fingerprint(k, objects, stack),
        fingerprint(v, objects, stack),
      ]);
      pairs.sort((a, b) => stableStringify(a).localeCompare(stableStringify(b)));
      return { __refMap: pairs };
    }
    return fingerprintObject(value, objects, stack);
  }
  return value;
}

function fingerprintObject(obj: any, objects: Record<string, any>, stack: Set<string>): any {
  const out: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    // Legacy serializes unset fields as the bareword `undefined` (parsed back as
    // the string "undefined"); an unset field is semantically absent.
    if (value === undefined || value === 'undefined') continue;
    out[key] = fingerprint(value, objects, stack);
  }
  return out;
}

/**
 * Deep structural diff. Objects are compared key-order-independently
 * (dictionaries), arrays are compared order-sensitively (ordered slots like
 * `buildPhases` / `files` / `children`). Returns the first divergence.
 */
function deepDiff(a: any, b: any, path: string): Diff {
  if (a === b) return EQUAL;
  if (typeof a !== typeof b || a === null || b === null) {
    return { equal: false, path, legacy: a, shim: b };
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return { equal: false, path, legacy: a, shim: b };
    if (a.length !== b.length) {
      return { equal: false, path: `${path}.length`, legacy: a.length, shim: b.length };
    }
    for (let i = 0; i < a.length; i++) {
      const diff = deepDiff(a[i], b[i], `${path}[${i}]`);
      if (!diff.equal) return diff;
    }
    return EQUAL;
  }
  if (typeof a === 'object') {
    const ak = Object.keys(a).sort();
    const bk = Object.keys(b).sort();
    if (ak.join('\0') !== bk.join('\0')) {
      return { equal: false, path: `${path} (keys)`, legacy: ak, shim: bk };
    }
    for (const key of ak) {
      const diff = deepDiff(a[key], b[key], path ? `${path}.${key}` : key);
      if (!diff.equal) return diff;
    }
    return EQUAL;
  }
  return { equal: false, path, legacy: a, shim: b };
}

function isaHistogram(objects: Record<string, any>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const obj of Object.values(objects)) {
    const isa = obj?.isa ?? '<no-isa>';
    counts[isa] = (counts[isa] ?? 0) + 1;
  }
  return counts;
}

/** Compare two already-parsed pbxproj graphs semantically. */
export function compareGraphs(legacy: Graph, shim: Graph): Diff {
  const histo = deepDiff(isaHistogram(legacy.objects), isaHistogram(shim.objects), 'objectsByIsa');
  if (!histo.equal) return histo;
  const fa = fingerprint(legacy.rootObject, legacy.objects, new Set());
  const fb = fingerprint(shim.rootObject, shim.objects, new Set());
  return deepDiff(fa, fb, '');
}

/** Parse both serialized pbxproj strings with one parser, then compare semantically. */
export function compareSemantics(legacyText: string, shimText: string): Diff {
  let legacy: Graph;
  let shim: Graph;
  try {
    legacy = parse(legacyText) as Graph;
  } catch (e: any) {
    return { equal: false, path: '<parse legacy>', legacy: e.message };
  }
  try {
    shim = parse(shimText) as Graph;
  } catch (e: any) {
    return { equal: false, path: '<parse shim>', shim: e.message };
  }
  return compareGraphs(legacy, shim);
}

// Strip one layer of outer quotes from every string. Reads aren't re-quoted by
// the shim (a documented behavior change), so quoting is cosmetic when comparing
// read results — `'"<group>"'` and `'<group>'` are the same value.
function stripQuotesDeep(value: any): any {
  if (typeof value === 'string') return value.replace(/^"(.*)"$/, '$1');
  if (Array.isArray(value)) return value.map(stripQuotesDeep);
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const key of Object.keys(value)) out[key] = stripQuotesDeep(value[key]);
    return out;
  }
  return value;
}

/** Compare scenario read results, normalizing UUIDs by first appearance and quoting. */
export function compareResults(legacy: unknown, shim: unknown): Diff {
  return deepDiff(
    stripQuotesDeep(normalizeResult(legacy)),
    stripQuotesDeep(normalizeResult(shim)),
    ''
  );
}

/**
 * Secondary, non-failing report: UUID-normalized line diff of the two serialized
 * outputs. Every entry is triaged as cosmetic-and-accepted or a real semantic
 * difference that the primary gate should also catch.
 */
export function normalizedTextDiff(
  legacyText: string,
  shimText: string
): { onlyLegacy: string[]; onlyShim: string[] } {
  const legacyLines = new Set(normalizeUuids(legacyText).split('\n'));
  const shimLines = new Set(normalizeUuids(shimText).split('\n'));
  return {
    onlyLegacy: [...legacyLines].filter((l) => !shimLines.has(l) && l.trim()),
    onlyShim: [...shimLines].filter((l) => !legacyLines.has(l) && l.trim()),
  };
}
