/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { isJscSafeUrl, toNormalUrl } from 'jsc-safe-url';
import { MixedOutput, Module } from 'metro';
import { InputConfigT, SerializerConfigT } from 'metro-config';
import baseJSBundle from 'metro/src/DeltaBundler/Serializers/baseJSBundle';
// @ts-expect-error
import sourceMapString from 'metro/src/DeltaBundler/Serializers/sourceMapString';
import bundleToString from 'metro/src/lib/bundleToString';
import path from 'path';

import { env } from '../env';
import {
  environmentVariableSerializerPlugin,
  serverPreludeSerializerPlugin,
} from './environmentVariableSerializerPlugin';
import { fileNameFromContents, getCssSerialAssets } from './getCssDeps';
import { SerialAsset } from './serializerAssets';
import { sideEffectsSerializerPlugin } from './sideEffectsSerializerPlugin';
import {
  createPostTreeShakeTransformSerializerPlugin,
  treeShakeSerializerPlugin,
} from './treeShakeSerializerPlugin';

export type Serializer = NonNullable<SerializerConfigT['customSerializer']>;

export type SerializerParameters = Parameters<Serializer>;

// A serializer that processes the input and returns a modified version.
// Unlike a serializer, these can be chained together.
export type SerializerPlugin = (
  ...props: SerializerParameters
) => SerializerParameters | Promise<SerializerParameters>;

export function withExpoSerializers(config: InputConfigT): InputConfigT {
  const processors: SerializerPlugin[] = [];
  processors.push(serverPreludeSerializerPlugin);
  if (!env.EXPO_NO_CLIENT_ENV_VARS) {
    processors.push(environmentVariableSerializerPlugin);
  }

  // First mark which modules have side-effects according to the `package.json`s.
  processors.push(sideEffectsSerializerPlugin);
  // Then tree-shake the modules.
  processors.push(treeShakeSerializerPlugin(config));
  // Then finish transforming the modules from AST to JS.
  processors.push(createPostTreeShakeTransformSerializerPlugin(config));

  return withSerializerPlugins(config, processors);
}

// There can only be one custom serializer as the input doesn't match the output.
// Here we simply run
export function withSerializerPlugins(
  config: InputConfigT,
  processors: SerializerPlugin[]
): InputConfigT {
  const originalSerializer = config.serializer?.customSerializer;

  return {
    ...config,
    serializer: {
      ...config.serializer,
      customSerializer: createSerializerFromSerialProcessors(processors, originalSerializer),
    },
  };
}

export function getDefaultSerializer(fallbackSerializer?: Serializer | null): Serializer {
  const defaultSerializer =
    fallbackSerializer ??
    (async (...params: SerializerParameters) => {
      const bundle = baseJSBundle(...params);
      const outputCode = bundleToString(bundle).code;
      return outputCode;
    });
  return async (
    ...props: SerializerParameters
  ): Promise<string | { code: string; map: string }> => {
    const [entryPoint, preModules, graph, options] = props;

    // if (process.env.NODE_ENV !== 'test') toFixture(...props);

    const jsCode = await defaultSerializer(entryPoint, preModules, graph, options);

    // console.log('OUTPUT CODE', jsCode);

    if (!options.sourceUrl) {
      return jsCode;
    }
    const sourceUrl = isJscSafeUrl(options.sourceUrl)
      ? toNormalUrl(options.sourceUrl)
      : options.sourceUrl;
    const url = new URL(sourceUrl, 'https://expo.dev');
    if (
      url.searchParams.get('platform') !== 'web' ||
      url.searchParams.get('serializer.output') !== 'static'
    ) {
      // Default behavior if `serializer.output=static` is not present in the URL.
      return jsCode;
    }

    const includeSourceMaps = url.searchParams.get('serializer.map') === 'true';

    const cssDeps = getCssSerialAssets<MixedOutput>(graph.dependencies, {
      projectRoot: options.projectRoot,
      processModuleFilter: options.processModuleFilter,
    });

    const jsAssets: SerialAsset[] = [];

    if (jsCode) {
      const stringContents = typeof jsCode === 'string' ? jsCode : jsCode.code;
      const jsFilename = fileNameFromContents({
        filepath: url.pathname,
        src: stringContents,
      });
      jsAssets.push({
        filename: options.dev ? 'index.js' : `_expo/static/js/web/${jsFilename}.js`,
        originFilename: 'index.js',
        type: 'js',
        metadata: {},
        source: stringContents,
      });

      if (
        // Only include the source map if the `options.sourceMapUrl` option is provided and we are exporting a static build.
        includeSourceMaps &&
        options.sourceMapUrl
      ) {
        const sourceMap = typeof jsCode === 'string' ? serializeToSourceMap(...props) : jsCode.map;

        // Make all paths relative to the server root to prevent the entire user filesystem from being exposed.
        const parsed = JSON.parse(sourceMap);
        // TODO: Maybe we can do this earlier.
        parsed.sources = parsed.sources.map(
          // TODO: Maybe basePath support
          (value: string) => {
            if (value.startsWith('/')) {
              return '/' + path.relative(options.serverRoot ?? options.projectRoot, value);
            }
            // Prevent `__prelude__` from being relative.
            return value;
          }
        );

        jsAssets.push({
          filename: options.dev ? 'index.map' : `_expo/static/js/web/${jsFilename}.js.map`,
          originFilename: 'index.map',
          type: 'map',
          metadata: {},
          source: JSON.stringify(parsed),
        });
      }
    }

    return JSON.stringify([...jsAssets, ...cssDeps]);
  };
}

function getSortedModules(
  graph: SerializerParameters[2],
  {
    createModuleId,
  }: {
    createModuleId: (path: string) => number;
  }
): readonly Module<any>[] {
  const modules = [...graph.dependencies.values()];
  // Assign IDs to modules in a consistent order
  for (const module of modules) {
    createModuleId(module.path);
  }
  // Sort by IDs
  return modules.sort(
    (a: Module<any>, b: Module<any>) => createModuleId(a.path) - createModuleId(b.path)
  );
}

function serializeToSourceMap(...props: SerializerParameters): string {
  const [, prepend, graph, options] = props;

  const modules = [
    ...prepend,
    ...getSortedModules(graph, {
      createModuleId: options.createModuleId,
    }),
  ];

  return sourceMapString(modules, {
    ...options,
  });
}

export function createSerializerFromSerialProcessors(
  processors: (SerializerPlugin | undefined)[],
  originalSerializer?: Serializer | null
): Serializer {
  const finalSerializer = getDefaultSerializer(originalSerializer);
  return async (...props: SerializerParameters): ReturnType<Serializer> => {
    // toFixture(...props);

    for (const processor of processors) {
      if (processor) {
        props = await processor(...props);
      }
    }

    return finalSerializer(...props);
  };
}

export { SerialAsset };
