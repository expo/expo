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

type PromiseWithResult<T> = Promise<T> & { _result?: T | Promise<T> };

export function inMemoryContext(context: MemoryContext, { lazy = false }: { lazy?: boolean } = {}) {
  // The keys whose module has loaded in the `lazy` import mode.
  const loaded = new Set<string>();

  return Object.assign(
    function (id: string) {
      id = id.replace(/^\.\//, '').replace(/\.\w*$/, '');
      const module = typeof context[id] === 'function' ? { default: context[id] } : context[id];
      if (!lazy) {
        return module;
      }
      // Like Metro's lazy context combined with Expo's async require: a promise that carries the
      // module in `_result` once its split bundle has loaded, and the pending promise until then.
      if (loaded.has(id)) {
        const promise: PromiseWithResult<typeof module> = Promise.resolve(module);
        promise._result = module;
        return promise;
      }
      const promise: PromiseWithResult<typeof module> = Promise.resolve().then(() => {
        loaded.add(id);
        return module;
      });
      promise._result = promise;
      return promise;
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

  const uniqueKeys = Array.from(new Set([...Object.keys(overrides), ...existingContext.keys()]));

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
      keys: () => [...uniqueKeys],
      resolve: (key: string) => key,
      id: '0',
    }
  );
}
