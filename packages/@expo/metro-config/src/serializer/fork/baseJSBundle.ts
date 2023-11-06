/**
 * Copyright © 2022 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
import getAppendScripts from 'metro/src/lib/getAppendScripts';
import type { Bundle } from 'metro-runtime/src/modules/types.flow';

import { processModules } from './processModules';

export function baseJSBundle(
  entryPoint: string,
  preModules: readonly Module[],
  graph: Pick<ReadOnlyGraph, 'dependencies'>,
  options: SerializerOptions
): Bundle {
  return baseJSBundleWithDependencies(
    entryPoint,
    preModules,
    [...graph.dependencies.values()],
    options
  );
}
export function baseJSBundleWithDependencies(
  entryPoint: string,
  preModules: readonly Module[],
  dependencies: Module<MixedOutput>[],
  options: SerializerOptions
): Bundle {
  for (const module of dependencies) {
    options.createModuleId(module.path);
  }

  const processModulesOptions = {
    filter: options.processModuleFilter,
    createModuleId: options.createModuleId,
    dev: options.dev,
    includeAsyncPaths: options.includeAsyncPaths,
    projectRoot: options.projectRoot,
    serverRoot: options.serverRoot,
    sourceUrl: options.sourceUrl,
  };

  // Do not prepend polyfills or the require runtime when only modules are requested
  if (options.modulesOnly) {
    preModules = [];
  }

  const preCode = processModules(preModules, processModulesOptions)
    .map(([_, code]) => code.src)
    .join('\n');

  const modules = [...dependencies].sort(
    (a: Module<MixedOutput>, b: Module<MixedOutput>) =>
      options.createModuleId(a.path) - options.createModuleId(b.path)
  );

  const postCode = processModules(
    getAppendScripts(entryPoint, [...preModules, ...modules], {
      asyncRequireModulePath: options.asyncRequireModulePath,
      createModuleId: options.createModuleId,
      getRunModuleStatement: options.getRunModuleStatement,
      inlineSourceMap: options.inlineSourceMap,
      runBeforeMainModule: options.runBeforeMainModule,
      runModule: options.runModule,
      shouldAddToIgnoreList: options.shouldAddToIgnoreList,
      sourceMapUrl: options.sourceMapUrl,
      sourceUrl: options.sourceUrl,
    }),
    processModulesOptions
  )
    .map(([_, code]) => code.src)
    .join('\n');

  const mods = processModules([...dependencies], processModulesOptions).map(([module, code]) => [
    options.createModuleId(module.path),
    code,
  ]);
  return {
    pre: preCode,
    post: postCode,
    modules: mods.map(([id, code]) => [id, typeof code === 'number' ? code : code.src]),
    _expoSplitBundlePaths: mods.map(([id, code]) => [
      id,
      typeof code === 'number' ? {} : code.paths,
    ]),
  };
}
