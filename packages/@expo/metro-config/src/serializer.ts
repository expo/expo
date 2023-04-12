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
import path from 'path';

import { env } from './env';
import { fileNameFromContents, getCssModules, hashString, SerialAsset } from './getCssDeps';
import { pathToHtmlSafeName } from './transform-worker/css';

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
    const str = `process.env=Object.defineProperties(process.env, {${Object.keys(
      getAllExpoPublicEnvVars()
    )
      .map((key) => `${JSON.stringify(key)}: { value: ${JSON.stringify(process.env[key])} }`)
      .join(',')}});`;

    const [firstModule, ...restModules] = preModules;
    // const envCode = `var process=this.process||{};${str}`;
    // process.env
    return [
      entryPoint,
      [
        // First module defines the process.env object.
        firstModule,
        // Second module modifies the process.env object.
        getEnvPrelude(str),
        // Now we add the rest
        ...restModules,
      ],
      graph,
      options,
    ];
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
  const code = '// HMR env vars from Expo CLI (dev-only)\n' + contents;
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
  const processors: SerialProcessor[] = [];
  if (!env.EXPO_NO_CLIENT_ENV_VARS) {
    processors.push(serializeWithEnvironmentVariables);
  }

  return withSerialProcessors(config, processors);
}

// There can only be one custom serializer as the input doesn't match the output.
// Here we simply run
export function withSerialProcessors(
  config: InputConfigT,
  processors: SerialProcessor[]
): InputConfigT {
  const originalSerializer = config.serializer?.customSerializer;

  if (originalSerializer) {
    console.warn('Custom Metro serializers are not supported with Expo CLI.');
  }

  return {
    ...config,
    serializer: {
      ...config.serializer,
      customSerializer: createSerializerFromSerialProcessors(processors, originalSerializer),
    },
  };
}

function getDefaultSerializer(): Serializer {
  return (...props: SerializerParameters): string | any => {
    const bundle = baseJSBundle(...props);
    const [, , graph, options] = props;
    if (!options.sourceUrl) {
      return bundleToString(bundle).code;
    }
    const url = new URL(options.sourceUrl, 'https://expo.dev');
    if (
      url.searchParams.get('platform') !== 'web' ||
      url.searchParams.get('serializer.export') !== 'html'
    ) {
      console.log('return js:', options.sourceUrl);
      // Default behavior if `serializer.export=html` is not present in the URL.
      return bundleToString(bundle).code;
    }

    const cssDeps = getCssModules(graph.dependencies, {
      projectRoot: options.projectRoot,
      processModuleFilter: options.processModuleFilter,
    });

    const jsCode = ''; //bundleToString(bundle).code;
    const jsAsset: SerialAsset = {
      filename: options.dev
        ? 'index.js'
        : `_expo/static/js/web/${fileNameFromContents({
            filepath: url.pathname,
            src: jsCode,
          })}.js`,
      originFilename: 'index.js',
      type: 'js',
      metadata: {},
      source: jsCode,
    };

    console.log('return html:', options.sourceUrl);
    return JSON.stringify([jsAsset, ...cssDeps]);
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

    const finalSerializer = getDefaultSerializer();
    // const finalSerializer = serializer ?? getDefaultSerializer();
    return finalSerializer(...props);
  };
}

import fs from 'fs';

export function writeSerialAssets(assets: SerialAsset[], { outputDir }: { outputDir: string }) {
  assets.forEach((asset) => {
    const output = path.join(outputDir, asset.filename);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, asset.source);
  });
}

export function htmlFromSerialAssets(
  assets: SerialAsset[],
  { dev, template, bundleUrl }: { dev: boolean; template: string; bundleUrl: string }
) {
  // Combine the CSS modules into tags that have hot refresh data attributes.
  const styleString = assets
    .filter((asset) => asset.type === 'css')
    .map(({ metadata, filename, source }) => {
      if (dev) {
        // TODO: No data id in prod
        return `<style data-expo-css-hmr="${metadata.hmrId}">` + source + '\n</style>';
      } else {
        return [
          `<link rel="preload" href="${filename}" as="style">`,
          `<link rel="stylesheet" href="${filename}">`,
        ].join('');
      }
    })
    .join('');

  const jsAssets = assets.filter((asset) => asset.type === 'js');

  const scripts = bundleUrl
    ? `<script src="${bundleUrl}" defer></script>`
    : jsAssets
        .map(({ filename }) => {
          return `<script src="${filename}" defer></script>`;
        })
        .join('');

  return template
    .replace('</head>', `${styleString}</head>`)
    .replace('</body>', `${scripts}\n</body>`);
}

// <link rel="preload" href="/_expo/static/css/xxxxxx.css" as="style">
export function appendLinkToHtml(
  html: string,
  links: { rel: string; href: string; as?: string }[]
) {
  return html.replace(
    '</head>',
    links
      .map((link) => {
        let linkTag = `<link rel="${link.rel}"`;

        if (link.href) linkTag += ` href="${link.href}"`;
        if (link.as) linkTag += ` as="${link.as}"`;

        linkTag += '>';

        return linkTag;
      })
      .join('') + '</head>'
  );
}
