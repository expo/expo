import type { LoaderFunction } from 'expo-server';
import path from 'path';

import type { NativeIntent } from '../types';
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
  return Object.assign(
    function (id: string) {
      id = id.replace(/^\.\//, '').replace(/\.\w*$/, '');
      return typeof context[id] === 'function' ? { default: context[id] } : context[id];
    },
    {
      resolve: (key: string) => key,
      id: '0',
      keys: () =>
        Object.keys(context).map((key) => {
          const ext = path.extname(key);
          key = key.replace(/^\.\//, '');
          key = key.startsWith('/') ? key : `./${key}`;
          key = validExtensions.includes(ext) ? key : `${key}.js`;

          return key;
        }),
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
export function normalizeKeys(keys: string[]): Record<string, string> {
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

  return Object.assign(
    function (id: string) {
      if (id in overrides) {
        const route = overrides[id];
        return typeof route === 'function' ? { default: route } : route;
      } else {
        return existingContext(id);
      }
    },
    {
      // Overrides take precedence, so drop any existing key they replace to keep
      // each route listed once (a duplicate key makes route resolution throw).
      keys: () => [
        ...Object.keys(overrides),
        ...existingContext.keys().filter((key) => !(key in overrides)),
      ],
      resolve: (key: string) => key,
      id: '0',
    }
  );
}
