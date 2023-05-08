/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ConfigT, InputConfigT } from 'metro-config';
import baseJSBundle from 'metro/src/DeltaBundler/Serializers/baseJSBundle';
import bundleToString from 'metro/src/lib/bundleToString';

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

function getDefaultSerializer(fallbackSerializer?: Serializer): Serializer {
  const defaultSerializer =
    fallbackSerializer ??
    ((...params: SerializerParameters) => {
      const bundle = baseJSBundle(...params);
      const outputCode = bundleToString(bundle).code;
      return outputCode;
    });
  return (...props: SerializerParameters): string | any => {
    const [, , graph, options] = props;
    const jsCode = defaultSerializer(...props);

    if (!options.sourceUrl) {
      return jsCode;
    }
    const url = new URL(options.sourceUrl, 'https://expo.dev');
    if (
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

    let jsAsset: SerialAsset | undefined;

    if (jsCode) {
      const stringContents = typeof jsCode === 'string' ? jsCode : jsCode.code;
      jsAsset = {
        filename: options.dev
          ? 'index.js'
          : `_expo/static/js/web/${fileNameFromContents({
              filepath: url.pathname,
              src: stringContents,
            })}.js`,
        originFilename: 'index.js',
        type: 'js',
        metadata: {},
        source: stringContents,
      };
    }

    return JSON.stringify([jsAsset, ...cssDeps]);
  };
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
