import path from 'path';

import { toPosixPath } from '../utils/Path';

const NAMED_ARRAY_KEYS = new Set(['modules', 'projects', 'plugins', 'pods', 'extraDependencies']);
const STRING_ARRAY_KEYS = new Set(['coreFeatures', 'configurations', 'buildTypes']);

const FILE_URL_REGEX = /^file:/i;
const NETWORK_URL_REGEX = /^[a-z][a-z0-9+.-]*:\/\//i;
const RELATIVE_OR_NODE_MODULES_PATH_REGEX = /^(?:\.\.?\/|node_modules\/)/;

/**
 * Normalizes resolved autolinking config before it is hashed.
 * Converts react-native-config dependency maps to a sorted array of objects and sorts known
 * arrays by their identifying field. `scriptPhases` is left in order.
 *
 * When `stripPaths` is true, filesystem path fields are omitted, including `scriptPhases[].path`
 * and `sourceDir` / `podspecPath` overrides from the project's **react-native.config.js**.
 * Linked names and `scriptPhases` names remain.
 */
export function normalizeAutolinkingConfig(
  config: unknown,
  options: { stripPaths: boolean; roots?: string[] }
): unknown {
  const roots = (options.roots ?? []).map((root) => toPosixPath(root));
  return normalizeNode(structuredClone(config), options.stripPaths, roots);
}

function normalizeNode(
  value: unknown,
  stripPaths: boolean,
  roots: string[],
  parentKey?: string
): unknown {
  if (Array.isArray(value)) {
    const mapped = value
      .map((item) => normalizeNode(item, stripPaths, roots, parentKey))
      .filter((item) => item !== undefined);
    return sortKnownArray(parentKey, mapped);
  }

  if (value && typeof value === 'object') {
    if (isNamedDependencyMap(value)) {
      return normalizeNode(namedMapToSortedArray(value), stripPaths, roots, 'modules');
    }

    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      if (stripPaths && typeof child === 'string' && isPathLike(child, roots)) {
        continue;
      }
      result[key] = normalizeNode(child, stripPaths, roots, key);
    }
    return result;
  }

  if (stripPaths && typeof value === 'string' && isPathLike(value, roots)) {
    return undefined;
  }
  return value;
}

/**
 * True when `value` is a `{ [packageName]: { root | platforms } }` map from react-native-config.
 * Those maps are converted to arrays because object key order is not stable across autolinking.
 */
function isNamedDependencyMap(value: object): value is Record<string, Record<string, unknown>> {
  const entries = Object.entries(value);
  if (entries.length === 0) {
    return false;
  }
  return entries.every(
    ([, child]) =>
      child != null &&
      typeof child === 'object' &&
      !Array.isArray(child) &&
      ('platforms' in child || 'root' in child)
  );
}

function namedMapToSortedArray(
  map: Record<string, Record<string, unknown>>
): Record<string, unknown>[] {
  return Object.entries(map)
    .sort(([left], [right]) => compareStrings(left, right))
    .map(([name, child]) => ({ ...child, name }));
}

function sortKnownArray(parentKey: string | undefined, items: unknown[]): unknown[] {
  if (parentKey && STRING_ARRAY_KEYS.has(parentKey)) {
    return [...items].sort((left, right) => compareStrings(String(left), String(right)));
  }
  if (parentKey && NAMED_ARRAY_KEYS.has(parentKey)) {
    return [...items].sort((left, right) => compareStrings(namedKey(left), namedKey(right)));
  }
  return items;
}

function namedKey(value: unknown): string {
  if (value == null || typeof value !== 'object') {
    return String(value);
  }
  const record = value as Record<string, unknown>;
  for (const key of ['packageName', 'name', 'podName', 'id', 'url'] as const) {
    if (typeof record[key] === 'string') {
      return record[key];
    }
  }
  return '';
}

function compareStrings(left: string, right: string): number {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

/**
 * True when `value` is a filesystem path, including values already rewritten relative to
 * `projectRoot` or a dependency root.
 * URLs are kept so extra Maven repos and similar project settings still hash.
 */
export function isPathLike(value: string, roots: string[]): boolean {
  if (!value) {
    return false;
  }
  if (FILE_URL_REGEX.test(value)) {
    return true;
  }
  if (NETWORK_URL_REGEX.test(value)) {
    return false;
  }

  const posixValue = toPosixPath(value);
  if (path.posix.isAbsolute(posixValue) || path.win32.isAbsolute(value)) {
    return true;
  }
  for (const root of roots) {
    if (!root) {
      continue;
    }
    if (posixValue === root || posixValue.startsWith(`${root}/`)) {
      return true;
    }
  }
  return RELATIVE_OR_NODE_MODULES_PATH_REGEX.test(posixValue);
}
