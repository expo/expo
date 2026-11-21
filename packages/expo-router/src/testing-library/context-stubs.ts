import type { LoaderFunction } from 'expo-server';
import path from 'path';

import type { NativeIntent } from '../types';
import type { FileContextKey } from '../types/paths';
import requireContext from './require-context-ponyfill';

export type ReactComponent = () => React.ReactElement<any, any> | null;
export type NativeIntentStub = NativeIntent;
export type FileStub =
  | (Record<string, unknown> & {
      default: ReactComponent;
      unstable_settings?: Record<string, any>;
      loader?: LoaderFunction;
    })
  | ReactComponent;

export type MemoryContext = Record<string, FileStub | NativeIntentStub> & {
  '+native-intent'?: NativeIntentStub;
};

export { requireContext };

const validExtensions = ['.js', '.jsx', '.ts', '.tsx'];

export function inMemoryContext(context: MemoryContext) {
  const originalKeys = new Map<string, string>();
  function getContextKeys() {
    originalKeys.clear();
    return Object.keys(context).map((originalKey) => {
      const ext = path.extname(originalKey);
      const name = originalKey.replace(/^\.?\//, '');
      const contextKey: FileContextKey = validExtensions.includes(ext)
        ? `./${name}`
        : `./${name}.js`;
      originalKeys.set(contextKey, originalKey);
      return contextKey;
    });
  }

  getContextKeys();

  return Object.assign(
    function (id: string) {
      id = originalKeys.get(id) ?? id.replace(/^\.\//, '').replace(/\.\w*$/, '');
      return typeof context[id] === 'function' ? { default: context[id] } : context[id];
    },
    {
      resolve: (key: string) => key,
      id: '0',
      keys: getContextKeys,
    }
  );
}

export function normalizeKey(key: string): string {
  const withoutPrefix = key.replace(/^\.\//, '');
  const ext = path.extname(withoutPrefix);
  return validExtensions.includes(ext) ? withoutPrefix.slice(0, -ext.length) : withoutPrefix;
}

export function findDuplicateKeys(normalizedKeys: readonly string[]): string[] {
  return normalizedKeys.filter(
    (normalizedKey, index) => normalizedKeys.indexOf(normalizedKey) !== index
  );
}

/**
 * Maps `requireContext` keys (`./name.ext`) to the extension-free, prefix-free
 * form used by `inMemoryContext` override keys (e.g. `_layout`, `nested/route`).
 *
 * The returned record is keyed by the normalized key and holds the original
 * require-context key, so a normalized key can be resolved back to the file it
 * came from. When two files normalize to the same key (e.g. both `index.jsx`
 * and `index.tsx`), it throws, matching the ambiguity `requireContext` cannot
 * represent.
 */
export function normalizeKeys<T extends string>(keys: T[]): Record<string, T> {
  const normalizedKeys = keys.map(normalizeKey);
  const duplicateKeys = findDuplicateKeys(normalizedKeys);
  if (duplicateKeys.length > 0) {
    throw new Error(`Multiple routes resolved to the same route: ${duplicateKeys.join(', ')}`);
  }
  return Object.fromEntries(keys.map((key) => [normalizeKey(key), key]));
}

export function requireContextWithOverrides(dir: string, overrides: MemoryContext) {
  const rawContext = requireContext(path.resolve(process.cwd(), dir));

  // Normalize the require-context keys (`./name.ext`) to the extension-free form
  // used by override keys, so `overrides` can be matched directly.
  const normalizedKeys = normalizeKeys(rawContext.keys());
  const existingContext = Object.assign((id: string) => rawContext(normalizedKeys[id] ?? id), {
    keys: () => Object.keys(normalizedKeys),
  });

  const uniqueKeys = Array.from(new Set([...Object.keys(overrides), ...existingContext.keys()]));

  return Object.assign(
    function (id: string) {
      id = normalizeKey(id);
      if (id in overrides) {
        const route = overrides[id];
        return typeof route === 'function' ? { default: route } : route;
      } else {
        return existingContext(id);
      }
    },
    {
      keys: () => uniqueKeys.map((key): FileContextKey => normalizedKeys[key] ?? `./${key}.js`),
      resolve: (key: string) => key,
      id: '0',
    }
  );
}
