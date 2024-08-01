/**
 * Type definitions for require(), which is necessary in Jest tests when resetting
 * the module cache or explicitly requiring mocks or actual modules.
 *
 * These type definitions are from the @types/node definitions.
 */
type NodeRequireFunction = (id: string) => any;

interface NodeRequire extends NodeRequireFunction {
  resolve: RequireResolve;
  cache: any;
  extensions: NodeExtensions;
  main: NodeModule | undefined;
}

interface RequireResolve {
  (id: string, options?: { paths?: string[] }): string;
  paths(request: string): string[] | null;
}

interface NodeExtensions {
  '.js': (m: NodeModule, filename: string) => any;
  '.json': (m: NodeModule, filename: string) => any;
  '.node': (m: NodeModule, filename: string) => any;
  [ext: string]: (m: NodeModule, filename: string) => any;
}

interface NodeModule {
  exports: any;
  require: NodeRequireFunction;
  id: string;
  filename: string;
  loaded: boolean;
  parent: NodeModule | null;
  children: NodeModule[];
  paths: string[];
}

declare let require: NodeRequire;
