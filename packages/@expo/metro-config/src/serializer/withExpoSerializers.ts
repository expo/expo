/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Module } from 'metro';
import { ConfigT, InputConfigT } from 'metro-config';
import baseJSBundle from 'metro/src/DeltaBundler/Serializers/baseJSBundle';
// @ts-expect-error
import sourceMapString from 'metro/src/DeltaBundler/Serializers/sourceMapString';
import bundleToString from 'metro/src/lib/bundleToString';
import path from 'path';

import { env } from '../env';
import { environmentVariableSerializerPlugin } from './environmentVariableSerializerPlugin';
import { fileNameFromContents, getCssSerialAssets } from './getCssDeps';
import { SerialAsset } from './serializerAssets';

export type Serializer = NonNullable<ConfigT['serializer']['customSerializer']>;

export type SerializerParameters = Parameters<Serializer>;

// A serializer that processes the input and returns a modified version.
// Unlike a serializer, these can be chained together.
export type SerializerPlugin = (...props: SerializerParameters) => SerializerParameters;

export function withExpoSerializers(config: InputConfigT): InputConfigT {
  const processors: SerializerPlugin[] = [];
  if (!env.EXPO_NO_CLIENT_ENV_VARS) {
    processors.push(environmentVariableSerializerPlugin);
  }

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
    // excludeSource: options.excludeSource,
    processModuleFilter: options.processModuleFilter,
  });
}

function getDefaultSerializer(fallbackSerializer?: Serializer): Serializer {
  const defaultSerializer =
    fallbackSerializer ??
    ((...params: SerializerParameters) => {
      const bundle = baseJSBundle(...params);
      return bundleToString(bundle).code;
    });
  return (...props: SerializerParameters): string | any => {
    const [, , graph, options] = props;

    const parsedOptions = { ...props[3] };
    const optionalSourceUrl = options.sourceUrl
      ? new URL(options.sourceUrl, 'https://expo.dev')
      : null;

    // Expose sourcemap control with a query param.
    const sourceMapQueryParam = optionalSourceUrl ? getSourceMapOption(optionalSourceUrl) : null;

    if (sourceMapQueryParam != null) {
      // Sync the options with the query parameter.
      if (sourceMapQueryParam === 'inline') {
        parsedOptions.inlineSourceMap = true;
      } else if (sourceMapQueryParam === false) {
        parsedOptions.inlineSourceMap = false;
        parsedOptions.sourceUrl = null;
      }
    }

    // Fully parse this tragedy option.
    const sourceMapOption =
      sourceMapQueryParam != null
        ? sourceMapQueryParam
        : parsedOptions.inlineSourceMap
        ? 'inline'
        : !!parsedOptions.sourceMapUrl;

    const isWeb = optionalSourceUrl?.searchParams.get('platform') === 'web';

    if (isWeb && optionalSourceUrl) {
      // relativize sourceUrl
      let pathWithQuery = optionalSourceUrl.pathname;
      let sourcemapPathWithQuery = '';
      // Use `.js` on web.
      if (pathWithQuery.endsWith('.bundle')) {
        pathWithQuery = pathWithQuery.slice(0, -'.bundle'.length);
        pathWithQuery += '.js';
      }
      sourcemapPathWithQuery = pathWithQuery + '.map';
      // Attach query (possibly not needed).
      if (optionalSourceUrl.search) {
        pathWithQuery += optionalSourceUrl.search;
        sourcemapPathWithQuery += optionalSourceUrl.search;
      }
      parsedOptions.sourceUrl = pathWithQuery;
      if (sourceMapOption === true) {
        parsedOptions.sourceMapUrl = sourcemapPathWithQuery;
      }
    }

    const jsCode = defaultSerializer(props[0], props[1], props[2], parsedOptions);
    const url = optionalSourceUrl;

    if (
      !url ||
      url.searchParams.get('platform') !== 'web' ||
      url.searchParams.get('serializer.output') !== 'static'
    ) {
      // Default behavior if `serializer.output=static` is not present in the URL.
      return jsCode;
    }

    const cssDeps = getCssSerialAssets(graph.dependencies, {
      projectRoot: options.projectRoot,
      processModuleFilter: options.processModuleFilter,
    });

    const jsAsset: SerialAsset[] = [];

    if (jsCode) {
      let stringContents = typeof jsCode === 'string' ? jsCode : jsCode.code;
      const hashedFileName = fileNameFromContents({
        filepath: url.pathname,
        src: stringContents,
      });
      const jsFilename = options.dev ? 'index.js' : `_expo/static/js/web/${hashedFileName}.js`;

      let sourceMap: string | null = null;

      if (sourceMapOption !== false) {
        sourceMap =
          typeof jsCode === 'string'
            ? serializeToSourceMap(props[0], props[1], props[2], parsedOptions)
            : jsCode.map;

        // Make all paths relative to the project root
        const parsed = JSON.parse(sourceMap);
        parsed.sources = parsed.sources.map(
          (value: string) => '/' + path.relative(options.projectRoot, value)
        );
        sourceMap = JSON.stringify(parsed);

        const sourcemapFilename = options.dev
          ? 'index.js.map'
          : `_expo/static/js/web/${hashedFileName}.js.map`;
        jsAsset.push({
          filename: sourcemapFilename,
          originFilename: 'index.js.map',
          type: 'map',
          metadata: {},
          source: sourceMap,
        });

        if (!options.dev) {
          // Replace existing sourceMappingURL comments if they exist
          stringContents = stringContents.replace(
            /^\/\/# sourceMappingURL=.*/m,
            `//# sourceMappingURL=/${sourcemapFilename}`
          );
          stringContents = stringContents.replace(
            /^\/\/# sourceURL=.*/m,
            `//# sourceURL=/${jsFilename}`
          );
        }
      } else {
        // TODO: Remove this earlier, using some built-in metro system.
        // Remove any sourceMappingURL and sourceURL comments
        stringContents = stringContents.replace(/^\/\/# sourceMappingURL=.*/gm, '');
        stringContents = stringContents.replace(/^\/\/# sourceURL=.*/gm, '');
      }

      jsAsset.push({
        filename: jsFilename,
        originFilename: 'index.js',
        type: 'js',
        metadata: {},
        source: stringContents,
      });
    }

    return JSON.stringify([...jsAsset, ...cssDeps]);
  };
}

function getSourceMapOption(url: URL) {
  const sourcemapQueryParam = url.searchParams.get('serializer.sourcemap');
  if (sourcemapQueryParam) {
    if (!['true', 'false', 'inline'].includes(sourcemapQueryParam)) {
      throw new Error(
        `Invalid value for 'serializer.sourcemap' query parameter: ${sourcemapQueryParam}. Expected one of: true, false, inline.`
      );
    } else if (sourcemapQueryParam === 'inline') {
      return sourcemapQueryParam;
    }
    return sourcemapQueryParam === 'true';
  }

  return null;
}

export function createSerializerFromSerialProcessors(
  processors: (SerializerPlugin | undefined)[],
  originalSerializer?: Serializer
): Serializer {
  const finalSerializer = getDefaultSerializer(originalSerializer);
  return (...props: SerializerParameters): ReturnType<Serializer> => {
    for (const processor of processors) {
      if (processor) {
        props = processor(...props);
      }
    }

    return finalSerializer(...props);
  };
}

export { SerialAsset };
