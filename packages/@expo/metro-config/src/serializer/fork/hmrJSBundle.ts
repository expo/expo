/**
 * Copyright © 2025 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork with support for using the same serializer paths as production and the first bundle.
 * https://github.com/facebook/metro/blob/87f717b8f5987827c75c82b3cb390060672628f0/packages/metro/src/DeltaBundler/Serializers/hmrJSBundle.js#L1C1-L152C30
 */

import type { DeltaResult, Module, ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler';
import type { HmrModule } from '@expo/metro/metro-runtime/modules/types';
import { addParamsToDefineCall } from '@expo/metro/metro-transform-plugins';
import jscSafeUrl from 'jsc-safe-url';
import path from 'node:path';

import { isJsModule, wrapModule } from './js';

const debug = require('debug')('Metro:HMR');

type Options = {
  clientUrl: URL;
  createModuleId: (id: string) => number;
  includeAsyncPaths: boolean;
  projectRoot: string;
  serverRoot: string;
};

function generateModules(
  sourceModules: Iterable<Module<any>>,
  graph: ReadOnlyGraph<any>,
  options: Options
): readonly HmrModule[] {
  const modules: HmrModule[] = [];

  for (const module of sourceModules) {
    if (isJsModule(module)) {
      const getPathname = (extension: 'bundle' | 'map') => {
        return (
          path
            .relative(
              options.serverRoot ?? options.projectRoot,
              path.join(
                path.dirname(module.path),
                path.basename(module.path, path.extname(module.path)) + '.' + extension
              )
            )
            .split(path.sep)
            // using this Metro particular convention for encoding file paths as URL paths.
            .map((segment) => encodeURIComponent(segment))
            .join('/')
        );
      };

      const clientUrl = new URL(options.clientUrl);
      clientUrl.searchParams.delete('excludeSource');

      clientUrl.pathname = getPathname('map');
      const sourceMappingURL = clientUrl.toString();

      clientUrl.pathname = getPathname('bundle');
      const sourceURL = jscSafeUrl.toJscSafeUrl(clientUrl.toString());

      debug(
        'got sourceMappingURL: %s\nand sourceURL: %s\nfor module: %s',
        sourceMappingURL,
        sourceURL,
        module.path
      );

      const code =
        prepareModule(module, graph, options) +
        `\n//# sourceMappingURL=${sourceMappingURL}\n` +
        `//# sourceURL=${sourceURL}\n`;

      modules.push({
        module: [options.createModuleId(module.path), code],
        sourceMappingURL,
        sourceURL,
      });
    }
  }

  return modules;
}

function prepareModule(module: Module<any>, graph: ReadOnlyGraph<any>, options: Options): string {
  const code = wrapModule(module, {
    ...options,
    sourceUrl: options.clientUrl.toString(),
    dev: true,
    skipWrapping: false,
    computedAsyncModulePaths: null,
    splitChunks: false,
  });

  const inverseDependencies = getInverseDependencies(module.path, graph);
  // Transform the inverse dependency paths to ids.
  const inverseDependenciesById = Object.create(null);
  Object.keys(inverseDependencies).forEach((path: string) => {
    inverseDependenciesById[options.createModuleId(path)] = inverseDependencies[path].map(
      options.createModuleId
    );
  });
  return addParamsToDefineCall(code.src, inverseDependenciesById);
}

/**
 * Instead of adding the whole inverseDependencies object into each changed
 * module (which can be really huge if the dependency graph is big), we only
 * add the needed inverseDependencies for each changed module (we do this by
 * traversing upwards the dependency graph).
 */
function getInverseDependencies(
  path: string,
  graph: ReadOnlyGraph<any>,
  inverseDependencies: { [key: string]: string[] } = {}
): { [key: string]: string[] } {
  // Dependency already traversed.
  if (path in inverseDependencies) {
    return inverseDependencies;
  }

  const module = graph.dependencies.get(path);
  if (!module) {
    return inverseDependencies;
  }

  inverseDependencies[path] = [];
  for (const inverse of module.inverseDependencies) {
    inverseDependencies[path].push(inverse);
    getInverseDependencies(inverse, graph, inverseDependencies);
  }

  return inverseDependencies;
}

function hmrJSBundle(
  delta: DeltaResult<any>,
  graph: ReadOnlyGraph<any>,
  options: Options
): {
  added: readonly HmrModule[];
  modified: readonly HmrModule[];
  deleted: readonly number[];
} {
  return {
    added: generateModules(delta.added.values(), graph, options),
    modified: generateModules(delta.modified.values(), graph, options),
    deleted: [...delta.deleted].map((path: string) => options.createModuleId(path)),
  };
}

export default hmrJSBundle;
