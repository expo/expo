/**
 * Copyright © 2023 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork of the jest resolver but with additional settings for Metro and pnp removed.
 * https://github.com/jestjs/jest/blob/d1a2ed7fea4bdc19836274cd810c8360e3ab62f3/packages/jest-resolve/src/defaultResolver.ts#L1
 */
import assert from 'assert';
import { dirname, isAbsolute, resolve as pathResolve } from 'path';
import { sync as resolveSync, SyncOpts as UpstreamResolveOptions } from 'resolve';
import * as resolve from 'resolve.exports';

import { directoryExistsSync, fileExistsSync } from '../../../utils/dir';

import type { JSONObject as PackageJSON } from '@expo/json-file';

/**
 * Allows transforming parsed `package.json` contents.
 *
 * @param pkg - Parsed `package.json` contents.
 * @param file - Path to `package.json` file.
 * @param dir - Directory that contains the `package.json`.
 *
 * @returns Transformed `package.json` contents.
 */
export type PackageFilter = (pkg: PackageJSON, file: string, dir: string) => PackageJSON;

/**
 * Allows transforming a path within a package.
 *
 * @param pkg - Parsed `package.json` contents.
 * @param path - Path being resolved.
 * @param relativePath - Path relative from the `package.json` location.
 *
 * @returns Relative path that will be joined from the `package.json` location.
 */
export type PathFilter = (pkg: PackageJSON, path: string, relativePath: string) => string;

export type ResolverOptions = {
  /** Directory to begin resolving from. */
  basedir: string;
  /** List of export conditions. */
  conditions?: Array<string>;
  /** Instance of default resolver. */
  defaultResolver: typeof defaultResolver;
  /** List of file extensions to search in order. */
  extensions?: Array<string>;
  /**
   * List of directory names to be looked up for modules recursively.
   *
   * @defaultValue
   * The default is `['node_modules']`.
   */
  moduleDirectory?: Array<string>;
  /**
   * List of `require.paths` to use if nothing is found in `node_modules`.
   *
   * @defaultValue
   * The default is `undefined`.
   */
  paths?: Array<string>;
  /** Allows transforming parsed `package.json` contents. */
  packageFilter?: PackageFilter;
  /** Allows transforms a path within a package. */
  pathFilter?: PathFilter;
  /** Current root directory. */
  rootDir?: string;

  enablePackageExports?: boolean;
} & Pick<
  UpstreamResolveOptions,
  'readPackageSync' | 'moduleDirectory' | 'extensions' | 'preserveSymlinks'
>;

type UpstreamResolveOptionsWithConditions = UpstreamResolveOptions & ResolverOptions;

export type SyncResolver = (path: string, options: ResolverOptions) => string;
export type AsyncResolver = (path: string, options: ResolverOptions) => Promise<string>;

export type Resolver = SyncResolver | AsyncResolver;

const defaultResolver: SyncResolver = (path, { enablePackageExports, ...options }) => {
  const resolveOptions: UpstreamResolveOptionsWithConditions = {
    ...options,

    isDirectory: directoryExistsSync,
    isFile: fileExistsSync,
    preserveSymlinks: false,
    defaultResolver,
    // readPackageSync,
    // realpathSync,
  };

  // resolveSync dereferences symlinks to ensure we don't create a separate
  // module instance depending on how it was referenced.
  const result = resolveSync(
    enablePackageExports ? getPathInModule(path, resolveOptions) : path,
    resolveOptions
  );

  return result;
};

export default defaultResolver;

/*
 * helper functions
 */

function getPathInModule(path: string, options: UpstreamResolveOptionsWithConditions): string {
  if (shouldIgnoreRequestForExports(path)) {
    return path;
  }

  // TODO: Disable for babel/runtime for https://github.com/facebook/metro/issues/984/

  if (path.startsWith('#')) {
    const closestPackageJson = findClosestPackageJson(options.basedir);

    if (!closestPackageJson) {
      throw new Error(
        `unable to locate closest package.json from ${options.basedir} when resolving import "${path}"`
      );
    }

    const pkg = options.readPackageSync!(options.readFileSync!, closestPackageJson);
    assert(pkg, 'package.json should be read by `readPackageSync`');

    const resolved = resolve.imports(
      pkg,
      path as resolve.Imports.Entry,
      createResolveOptions(options.conditions)
    );

    if (resolved) {
      const target = resolved[0];
      return target.startsWith('.')
        ? // internal relative filepath
          pathResolve(dirname(closestPackageJson), target)
        : // this is an external module, re-resolve it
          defaultResolver(target, options);
    }

    if (pkg.imports) {
      throw new Error(
        "`imports` exists, but no results - this is a bug in Expo CLI's Metro resolver. Please report an issue"
      );
    }
  }

  const segments = path.split('/');

  let moduleName = segments.shift();

  if (moduleName) {
    if (moduleName.startsWith('@')) {
      moduleName = `${moduleName}/${segments.shift()}`;
    }

    // self-reference
    const closestPackageJson = findClosestPackageJson(options.basedir);
    if (closestPackageJson) {
      const pkg = options.readPackageSync!(options.readFileSync!, closestPackageJson);
      assert(pkg, 'package.json should be read by `readPackageSync`');

      if (pkg.name === moduleName) {
        const resolved = resolve.exports(
          pkg,
          (segments.join('/') || '.') as resolve.Exports.Entry,
          createResolveOptions(options.conditions)
        );

        if (resolved) {
          return pathResolve(dirname(closestPackageJson), resolved[0]);
        }

        if (pkg.exports) {
          throw new Error(
            "`exports` exists, but no results - this is a bug in Expo CLI's Metro resolver. Please report an issue"
          );
        }
      }
    }

    let packageJsonPath = '';

    try {
      packageJsonPath = resolveSync(`${moduleName}/package.json`, options);
    } catch {
      // ignore if package.json cannot be found
    }

    if (packageJsonPath && fileExistsSync(packageJsonPath)) {
      const pkg = options.readPackageSync!(options.readFileSync!, packageJsonPath);
      assert(pkg, 'package.json should be read by `readPackageSync`');

      const resolved = resolve.exports(
        pkg,
        (segments.join('/') || '.') as resolve.Exports.Entry,
        createResolveOptions(options.conditions)
      );

      if (resolved) {
        return pathResolve(dirname(packageJsonPath), resolved[0]);
      }

      if (pkg.exports) {
        throw new Error(
          "`exports` exists, but no results - this is a bug in Expo CLI's Metro resolver. Please report an issue"
        );
      }
    }
  }

  return path;
}

function createResolveOptions(conditions: Array<string> | undefined): resolve.Options {
  return conditions
    ? { conditions, unsafe: true }
    : // no conditions were passed - let's assume this is Jest internal and it should be `require`
      { browser: false, require: true };
}

// if it's a relative import or an absolute path, imports/exports are ignored
const shouldIgnoreRequestForExports = (path: string) => path.startsWith('.') || isAbsolute(path);

// adapted from
// https://github.com/lukeed/escalade/blob/2477005062cdbd8407afc90d3f48f4930354252b/src/sync.js
export function findClosestPackageJson(start: string): string | undefined {
  let dir = pathResolve('.', start);
  if (!directoryExistsSync(dir)) {
    dir = dirname(dir);
  }

  while (true) {
    const pkgJsonFile = pathResolve(dir, './package.json');
    const hasPackageJson = fileExistsSync(pkgJsonFile);

    if (hasPackageJson) {
      return pkgJsonFile;
    }

    const prevDir = dir;
    dir = dirname(dir);

    if (prevDir === dir) {
      return undefined;
    }
  }
}
