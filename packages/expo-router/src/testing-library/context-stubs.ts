import path from 'path';

import requireContext from './require-context-ponyfill';

export type ReactComponent = () => React.ReactElement<any, any> | null;
export type NativeIntentStub = {
  redirectSystemPath?: (event: {
    path: string | null;
    initial: boolean;
  }) => Promise<string | null | undefined> | string | null | undefined;
  subscribe?: (
    listener: (path: string) => void
  ) => Promise<() => void | void> | (() => void) | void;
};
export type FileStub =
  | (Record<string, unknown> & {
      default: ReactComponent;
      unstable_settings?: Record<string, any>;
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
          return validExtensions.includes(ext) ? `./${key}` : `./${key}.js`;
        }),
    }
  );
}

export function requireContextWithOverrides(dir: string, overrides: MemoryContext) {
  const existingContext = requireContext(path.resolve(process.cwd(), dir));

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
      keys: () => [...Object.keys(overrides), ...existingContext.keys()],
      resolve: (key: string) => key,
      id: '0',
    }
  );
}
