import path from "path";

import requireContext from "./require-context-ponyfill";

export type ReactComponent = () => React.ReactElement<any, any> | null;
export type FileStub =
  | (Record<string, unknown> & {
      default: ReactComponent;
      unstable_settings?: Record<string, any>;
    })
  | ReactComponent;

export { requireContext };

export function inMemoryContext(context: Record<string, FileStub>) {
  return Object.assign(
    function (id: string) {
      id = id.replace(/^\.\//, "").replace(/\.js$/, "");
      return typeof context[id] === "function"
        ? { default: context[id] }
        : context[id];
    },
    {
      keys: () => Object.keys(context).map((key) => "./" + key + ".js"),
      resolve: (key: string) => key,
      id: "0",
    }
  );
}

export function requireContextWithOverrides(
  dir: string,
  overrides: Record<string, FileStub>
) {
  const existingContext = requireContext(path.resolve(process.cwd(), dir));

  return Object.assign(
    function (id: string) {
      if (id in overrides) {
        const route = overrides[id];
        return typeof route === "function" ? { default: route } : route;
      } else {
        return existingContext(id);
      }
    },
    {
      keys: () => [...Object.keys(overrides), ...existingContext.keys()],
      resolve: (key: string) => key,
      id: "0",
    }
  );
}
