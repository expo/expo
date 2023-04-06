/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Graph, Module, SerializerOptions } from 'metro';
import { ConfigT, InputConfigT } from 'metro-config';
import baseJSBundle from 'metro/src/DeltaBundler/Serializers/baseJSBundle';
import bundleToString from 'metro/src/lib/bundleToString';

const debug = require('debug')('expo:metro-config:serializer') as typeof console.log;

type Serializer = NonNullable<ConfigT['serializer']['customSerializer']>;

type SerializerParameters = Parameters<Serializer>;

// A serializer that processes the input and returns a modified version.
// Unlike a serializer, these can be chained together.
type SerialProcessor = (...props: SerializerParameters) => SerializerParameters;

export function replaceEnvironmentVariables(
  code: string,
  env: Record<string, string | undefined>
): string {
  // match and replace env variables that aren't NODE_ENV or JEST_WORKER_ID
  // return code.match(/process\.env\.(EXPO_PUBLIC_[A-Z_]+)/g);
  return code.replace(/process\.env\.([a-zA-Z0-9_]+)/gm, (match) => {
    const name = match.replace('process.env.', '');
    if (
      // Must start with EXPO_PUBLIC_ to be replaced
      !/^EXPO_PUBLIC_/.test(name)
    ) {
      return match;
    }

    const value = JSON.stringify(env[name] ?? '');
    debug(`Inlining environment variable "${match}" with ${value}`);
    return value;
  });
}

export function getTransformEnvironment(url: string): string | null {
  const match = url.match(/[&?]transform\.environment=([^&]+)/);
  return match ? match[1] : null;
}

export function serializeWithEnvironmentVariables(
  entryPoint: string,
  preModules: readonly Module[],
  graph: Graph,
  options: SerializerOptions
): SerializerParameters {
  // Skip replacement in Node.js environments.
  if (options.sourceUrl && getTransformEnvironment(options.sourceUrl) === 'node') {
    debug('Skipping environment variable inlining in Node.js environment.');
    return [entryPoint, preModules, graph, options];
  }

  // Adds about 5ms on a blank Expo Router app.
  // TODO: We can probably cache the results.

  for (const value of graph.dependencies.values()) {
    // Skip node_modules, the feature is a bit too sensitive to allow in arbitrary code.
    if (/node_modules/.test(value.path)) {
      continue;
    }

    for (const index in value.output) {
      // TODO: This probably breaks source maps.
      const code = replaceEnvironmentVariables(value.output[index].data.code, process.env);
      value.output[index].data.code = code;
    }
  }

  return [entryPoint, preModules, graph, options];
}

export function withExpoSerializers(config: InputConfigT): InputConfigT {
  return withSerialProcessors(config, [serializeWithEnvironmentVariables]);
}

// There can only be one custom serializer as the input doesn't match the output.
// Here we simply run
export function withSerialProcessors(
  config: InputConfigT,
  processors: SerialProcessor[]
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

function getDefaultSerializer(): Serializer {
  return (...props: SerializerParameters): string => {
    const bundle = baseJSBundle(...props);
    return bundleToString(bundle).code;
  };
}

export function createSerializerFromSerialProcessors(
  processors: (SerialProcessor | undefined)[],
  serializer?: Serializer
): Serializer {
  return (...props: SerializerParameters): ReturnType<Serializer> => {
    for (const processor of processors) {
      if (processor) {
        props = processor(...props);
      }
    }

    const finalSerializer = serializer ?? getDefaultSerializer();
    return finalSerializer(...props);
  };
}
