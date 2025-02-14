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

import jscSafeUrl from 'jsc-safe-url';
import type { DeltaResult, Module, ReadOnlyGraph } from 'metro';
import type { HmrModule } from 'metro-runtime/src/modules/types.flow';
import { addParamsToDefineCall } from 'metro-transform-plugins';
import path from 'node:path';
import type { UrlWithParsedQuery as EntryPointURL } from 'node:url';
import url from 'node:url';

import { isJsModule, wrapModule } from './js';

type Options = {
  clientUrl: EntryPointURL;
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
      // Construct a bundle URL for this specific module only
      const getURL = (extension: 'bundle' | 'map') => {
        const moduleUrl = url.parse(url.format(options.clientUrl), true);
        // the legacy url object is parsed with both "search" and "query" fields.
        // for the "query" field to be used when formatting the object bach to string, the "search" field must be empty.
        // https://nodejs.org/api/url.html#urlformaturlobject:~:text=If%20the%20urlObject.search%20property%20is%20undefined
        moduleUrl.search = '';
        moduleUrl.pathname = path.relative(
          options.serverRoot ?? options.projectRoot,
          path.join(
            path.dirname(module.path),
            path.basename(module.path, path.extname(module.path)) + '.' + extension
          )
        );
        delete moduleUrl.query.excludeSource;
        return url.format(moduleUrl);
      };

      const sourceMappingURL = getURL('map');
      const sourceURL = jscSafeUrl.toJscSafeUrl(getURL('bundle'));
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
    sourceUrl: url.format(options.clientUrl),
    dev: true,
    skipWrapping: false,
    computedAsyncModulePaths: null,
    splitChunks: false,
  });

  const inverseDependencies = getInverseDependencies(module.path, graph);
  // Transform the inverse dependency paths to ids.
  const inverseDependenciesById = Object.create(null);
  Object.keys(inverseDependencies).forEach((path: string) => {
    // $FlowFixMe[prop-missing]
    // $FlowFixMe[invalid-computed-prop]
    inverseDependenciesById[options.createModuleId(path)] = inverseDependencies[path].map(
      options.createModuleId
    );
  });
  return addParamsToDefineCall(code.src, inverseDependenciesById);
}

/**
 * Instead of adding the whole inverseDependncies object into each changed
 * module (which can be really huge if the dependency graph is big), we only
 * add the needed inverseDependencies for each changed module (we do this by
 * traversing upwards the dependency graph).
 */
function getInverseDependencies(
  path: string,
  graph: ReadOnlyGraph<any>,
  inverseDependencies: { [key: string]: Array<string> } = {}
): { [key: string]: Array<string> } {
  // Dependency alredy traversed.
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
