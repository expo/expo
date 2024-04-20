import path from 'path';

import requireContext from './require-context-ponyfill';

export type ReactComponent = () => React.ReactElement<any, any> | null;
export type FileStub =
  | (Record<string, unknown> & {
      default: ReactComponent;
      unstable_settings?: Record<string, any>;
    })
  | ReactComponent;

export { requireContext };

const validExtensions = ['.js', '.jsx', '.ts', '.tsx'];

export function inMemoryContext(context: Record<string, FileStub>) {
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

export function requireContextWithOverrides(dir: string, overrides: Record<string, FileStub>) {
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
