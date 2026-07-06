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
 * require-context key, allowing overrides to be resolved back to the id they
 * replace. When two files normalize to the same key (e.g. both `index.jsx` and
 * `index.tsx`), it throws, matching the ambiguity `requireContext` cannot
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
  const existingContext = requireContext(path.resolve(process.cwd(), dir));

  const normalizedExistingKeys = normalizeKeys(existingContext.keys());

  // Resolve each override to the require-context id it replaces, falling back to
  // `./name` for overrides that introduce a file not present in `dir`.
  const overridesByContextKey = new Map<string, FileStub | NativeIntentStub>();
  for (const [key, value] of Object.entries(overrides)) {
    const contextKey = normalizedExistingKeys[key] ?? `./${key}`;
    overridesByContextKey.set(contextKey, value);
  }

  return Object.assign(
    function (id: string) {
      if (overridesByContextKey.has(id)) {
        const route = overridesByContextKey.get(id)!;
        return typeof route === 'function' ? { default: route } : route;
      }
      return existingContext(id);
    },
    {
      // Override keys take precedence, so omit any existing key they replace to
      // avoid listing the same route twice.
      keys: () => {
        const overrideKeys = [...overridesByContextKey.keys()];
        const dedupedExisting = existingContext
          .keys()
          .filter((key) => !overridesByContextKey.has(key));
        return [...overrideKeys, ...dedupedExisting];
      },
      resolve: (key: string) => key,
      id: '0',
    }
  );
}
