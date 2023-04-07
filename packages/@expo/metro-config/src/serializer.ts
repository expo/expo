/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Graph, MixedOutput, Module, SerializerOptions } from 'metro';
import { ConfigT, InputConfigT } from 'metro-config';
import baseJSBundle from 'metro/src/DeltaBundler/Serializers/baseJSBundle';
import bundleToString from 'metro/src/lib/bundleToString';
import countLines from 'metro/src/lib/countLines';

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

function getAllExpoPublicEnvVars() {
  // Create an object containing all environment variables that start with EXPO_PUBLIC_
  const env = {};
  for (const key in process.env) {
    if (key.startsWith('EXPO_PUBLIC_')) {
      // @ts-ignore
      env[key] = process.env[key];
    }
  }
  return env;
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

  // In development, we need to add the process.env object to ensure it
  // persists between Fast Refresh updates.
  if (options.dev) {
    // Set the process.env object to the current environment variables object
    // ensuring they aren't iterable, settable, or enumerable.
    const str = `Object.defineProperty(process, 'env', {
      value: Object.freeze(Object.defineProperties({}, {
        ${Object.keys(getAllExpoPublicEnvVars())
          .map((key) => `${JSON.stringify(key)}: { value: ${JSON.stringify(process.env[key])} }`)
          .join(',')}
      }))
    });`;

    const envCode = `var process=this.process||{};${str}`;
    return [entryPoint, [getEnvPrelude(envCode), ...preModules], graph, options];
  }

  // In production, inline all process.env variables to ensure they cannot be iterated and read arbitrarily.
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

function getEnvPrelude(contents: string): Module<MixedOutput> {
  const code = '// Injected by Expo CLI\n' + contents;
  const name = '__env__';

  return {
    dependencies: new Map(),
    getSource: (): Buffer => Buffer.from(code),
    inverseDependencies: new Set(),
    path: name,
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
  };
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
