/**
 * Copyright © 2022 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork with bundle splitting and better source map support.
 * https://github.com/facebook/metro/blob/bbdd7d7c5e6e0feb50a9967ffae1f723c1d7c4e8/packages/metro/src/DeltaBundler/Serializers/baseJSBundle.js#L1
 */

import type {
  MixedOutput,
  Module,
  ReadOnlyGraph,
  SerializerOptions,
} from '@bycedric/metro/metro/src/DeltaBundler/types.flow';
import CountingSet from '@bycedric/metro/metro/src/lib/CountingSet';
import countLines from '@bycedric/metro/metro/src/lib/countLines';
import getAppendScripts from '@bycedric/metro/metro/src/lib/getAppendScripts';
import { isJscSafeUrl, toNormalUrl } from 'jsc-safe-url';

import { processModules } from './processModules';

export type ModuleMap = [number, string][];

export type Bundle = {
  modules: ModuleMap;
  post: string;
  pre: string;
  paths: Record<
    // Module ID
    string,
    // Split paths { moduleId: URL }
    Record<string, string>
  >;
};

export type ExpoSerializerOptions = SerializerOptions & {
  serializerOptions?: {
    baseUrl?: string;
    skipWrapping?: boolean;
    usedExports?: boolean;
    splitChunks?: boolean;
    output?: string;
    includeSourceMaps?: boolean;
  };
  // Chunk-based stable identifier for the bundle that is used for identifying the bundle.
  // https://sentry.engineering/blog/the-case-for-debug-ids
  // https://bun.sh/docs/bundler#sourcemap
  debugId?: string;
};

export function getPlatformOption(
  graph: Pick<ReadOnlyGraph, 'transformOptions'>,
  options: Pick<SerializerOptions, 'sourceUrl'>
): string | null {
  if (graph.transformOptions?.platform != null) {
    return graph.transformOptions.platform;
  }
  if (!options.sourceUrl) {
    return null;
  }

  const sourceUrl = isJscSafeUrl(options.sourceUrl)
    ? toNormalUrl(options.sourceUrl)
    : options.sourceUrl;
  const url = new URL(sourceUrl, 'https://expo.dev');
  return url.searchParams.get('platform') ?? null;
}

export function getBaseUrlOption(
  graph: Pick<ReadOnlyGraph, 'transformOptions'>,
  options: Pick<ExpoSerializerOptions, 'serializerOptions'>
): string {
  const baseUrl = graph.transformOptions?.customTransformOptions?.baseUrl;
  if (typeof baseUrl === 'string') {
    // This tells us that the value came over a URL and may be encoded.
    const mayBeEncoded = options.serializerOptions == null;
    const option = mayBeEncoded ? decodeURIComponent(baseUrl) : baseUrl;

    return option.replace(/\/+$/, '') + '/';
  }
  return '/';
}

export function baseJSBundle(
  entryPoint: string,
  preModules: readonly Module[],
  graph: Pick<ReadOnlyGraph, 'dependencies' | 'transformOptions'>,
  options: ExpoSerializerOptions
): Bundle {
  const platform = getPlatformOption(graph, options);
  if (platform == null) {
    throw new Error('platform could not be determined for Metro bundle');
  }

  return baseJSBundleWithDependencies(entryPoint, preModules, [...graph.dependencies.values()], {
    ...options,
    baseUrl: getBaseUrlOption(graph, options),
    splitChunks: !!options.serializerOptions?.splitChunks,
    platform,
    skipWrapping: !!options.serializerOptions?.skipWrapping,
    computedAsyncModulePaths: null,
  });
}

export function baseJSBundleWithDependencies(
  entryPoint: string,
  preModules: readonly Module[],
  dependencies: Module<MixedOutput>[],
  options: ExpoSerializerOptions & {
    platform: string;
    baseUrl: string;
    splitChunks: boolean;
    skipWrapping: boolean;
    computedAsyncModulePaths: Record<string, string> | null;
    debugId?: string;
  }
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
    sourceUrl: options.sourceUrl ?? undefined,
    platform: options.platform,
    baseUrl: options.baseUrl,
    splitChunks: options.splitChunks,
    skipWrapping: options.skipWrapping,
    computedAsyncModulePaths: options.computedAsyncModulePaths,
  };

  // Do not prepend polyfills or the require runtime when only modules are requested
  if (options.modulesOnly) {
    preModules = [];
  }

  const preCode = processModules(preModules, processModulesOptions)
    .map(([, code]) => code.src)
    .join('\n');

  const modules = [...dependencies].sort(
    (a: Module<MixedOutput>, b: Module<MixedOutput>) =>
      options.createModuleId(a.path) - options.createModuleId(b.path)
  );

  const sourceMapUrl =
    options.serializerOptions?.includeSourceMaps === false ? undefined : options.sourceMapUrl;

  const modulesWithAnnotations = getAppendScripts(entryPoint, [...preModules, ...modules], {
    asyncRequireModulePath: options.asyncRequireModulePath,
    createModuleId: options.createModuleId,
    getRunModuleStatement: options.getRunModuleStatement,
    inlineSourceMap: options.inlineSourceMap,
    runBeforeMainModule: options.runBeforeMainModule,
    runModule: options.runModule,
    shouldAddToIgnoreList: options.shouldAddToIgnoreList,
    sourceMapUrl,
    // This directive doesn't make a lot of sense in the context of a large single bundle that represent
    // multiple files. It's usually used for things like TypeScript where you want the file name to appear with a
    // different extension. Since it's unclear to me (Bacon) how it is used on native, I'm only disabling in web and native in production.
    sourceUrl:
      options.platform === 'web' ? undefined : !options.dev ? undefined : options.sourceUrl,
  }) as Module[];

  // If the `debugId` annotation is available and we aren't inlining the source map, add it to the bundle.
  // NOTE: We may want to move this assertion up further.
  const hasExternalMaps = !options.inlineSourceMap && !!sourceMapUrl;
  if (hasExternalMaps && options.debugId != null) {
    const code = `//# debugId=${options.debugId}`;
    modulesWithAnnotations.push({
      path: 'debug-id-annotation',
      dependencies: new Map(),
      getSource: (): Buffer => Buffer.from(''),
      inverseDependencies: new CountingSet(),
      output: [
        {
          type: 'js/script/virtual',
          data: {
            code,
            lineCount: countLines(code),
            map: [],
          },
        },
      ],
    });
  }

  const postCode = processModules(modulesWithAnnotations, processModulesOptions)
    .map(([, code]) => code.src)
    .join('\n');

  const mods = processModules([...dependencies], processModulesOptions).map(([module, code]) => [
    options.createModuleId(module.path),
    code,
  ]);
  return {
    pre: preCode,
    post: postCode,
    modules: mods.map(([id, code]) => [
      id,
      typeof code === 'number' ? code : code.src,
    ]) as ModuleMap,
    paths: Object.fromEntries(
      (
        mods.filter(([id, code]) => typeof code !== 'number' && Object.keys(code.paths).length) as [
          string,
          { src: string; paths: Record<string, string> },
        ][]
      ).map(([id, code]) => [id, code.paths])
    ),
  };
}
