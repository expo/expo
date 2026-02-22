/* eslint-disable */

// NOTE: This module is named `metro-require.d.ts` for backwards compatibility, since it's accessible to users
// However, it's supposed to be understood more as a "Metro environment" typings file that provides types for `require` and `module`,
// regardless of if `@types/node` is present, and/or, to enhance `@types/node` if it's present

declare namespace __MetroModuleApi {
  export interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    [key: string]: string | undefined;
  }

  export interface Process {
    env: ProcessEnv;
  }

  export interface RequireContext {
    /** Return the keys that can be resolved. */
    keys(): string[];
    (id: string): any;
    <T>(id: string): T;
    /** **Unimplemented:** Return the module identifier for a user request. */
    resolve(id: string): string;
    /** **Unimplemented:** Readable identifier for the context module. */
    id: string;
  }

  // Adds support for the runtime `require.context` method.
  export interface RequireFunction {
    /**
     * Returns the exports from a dependency. The call is sync. No request to the server is fired. The compiler ensures that the dependency is available.
     */
    (path: string): any;
    <T>(path: string): T;

    /**
     * **Experimental:** Import all modules in a given directory. This module dynamically updates when the files in a directory are added or removed.
     *
     * **Enabling:** This feature can be enabled by setting the `transformer.unstable_allowRequireContext` property to `true` in your Metro configuration.
     *
     * @param path File path pointing to the directory to require.
     * @param recursive Should search for files recursively. Optional, default `true` when `require.context` is used.
     * @param filter Filename filter pattern for use in `require.context`. Optional, default `.*` (any file) when `require.context` is used.
     * @param mode Mode for resolving dynamic dependencies. Defaults to `sync`.
     */
    context(
      path: string,
      recursive?: boolean,
      filter?: RegExp,
      mode?: 'sync' | 'eager' | 'weak' | 'lazy' | 'lazy-once'
    ): RequireContext;
  }

  export interface Module {
    exports: any;
  }
}

declare namespace NodeJS {
  export interface Require extends __MetroModuleApi.RequireFunction {}
  export interface Module extends __MetroModuleApi.Module {}
  export interface ProcessEnv extends __MetroModuleApi.ProcessEnv {}
  export interface Process extends __MetroModuleApi.Process {}
}

declare var require: NodeJS.Require;
declare var module: NodeJS.Module;
declare var process: NodeJS.Process;
