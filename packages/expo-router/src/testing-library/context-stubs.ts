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

export function requireContextWithOverrides(dir: string, overrides: MemoryContext) {
  const existingContext = requireContext(path.resolve(process.cwd(), dir));
  const existingKeys = existingContext.keys();

  // Override keys are extension-free and use no leading notation (e.g. `_layout`),
  // as documented for `inMemoryContext`. `requireContext` produces keys in the
  // `./name.ext` form, so normalize each override key to the matching context key
  // (falling back to `./name`) before performing lookups.
  const normalizedOverrides: MemoryContext = {};
  for (const [key, value] of Object.entries(overrides)) {
    const withPrefix = `./${key}`;
    const match = existingKeys.find((existingKey) =>
      validExtensions.some((ext) => existingKey === `${withPrefix}${ext}`)
    );
    normalizedOverrides[match ?? withPrefix] = value;
  }

  return Object.assign(
    function (id: string) {
      if (id in normalizedOverrides) {
        const route = normalizedOverrides[id];
        return typeof route === 'function' ? { default: route } : route;
      } else {
        return existingContext(id);
      }
    },
    {
      // Override keys take precedence, so omit any existing key they replace to
      // avoid listing the same route twice.
      keys: () => {
        const overrideKeys = Object.keys(normalizedOverrides);
        const dedupedExisting = existingKeys.filter((key) => !(key in normalizedOverrides));
        return [...overrideKeys, ...dedupedExisting];
      },
      resolve: (key: string) => key,
      id: '0',
    }
  );
}
