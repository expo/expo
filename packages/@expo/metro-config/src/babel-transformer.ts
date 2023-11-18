/**
 * Copyright (c) 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// A fork of the upstream babel-transformer that uses Expo-specific babel defaults
// and adds support for web and Node.js environments via `isServer` on the Babel caller.

import type { BabelTransformer, BabelTransformerArgs } from 'metro-babel-transformer';
import assert from 'node:assert';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { type TransformOptions, transformSync, transformFromAstSync } from './babel-core';

const cacheKeyParts = [
  fs.readFileSync(__filename),
  require('babel-preset-fbjs/package.json').version,
];

// TS detection conditions copied from metro-react-native-babel-preset
function isTypeScriptSource(fileName: string): boolean {
  return fileName?.endsWith('.ts');
}

function isTSXSource(fileName: string): boolean {
  return fileName?.endsWith('.tsx');
}

/**
 * Returns a memoized function that checks for the existence of a
 * project-level .babelrc file. If it doesn't exist, it reads the
 * default React Native babelrc file and uses that.
 */
const getBabelRC = (function () {
  let babelRC: Pick<TransformOptions, 'extends' | 'presets'> | null = null;

  return function _getBabelRC({ projectRoot }: { projectRoot: string }) {
    if (babelRC !== null) {
      return babelRC;
    }

    babelRC = {};

    if (projectRoot) {
      // Check for various babel config files in the project root
      // TODO(EvanBacon): We might want to disable babelrc lookup when the user specifies `enableBabelRCLookup: false`.
      const possibleBabelRCPaths = ['.babelrc', '.babelrc.js', 'babel.config.js'];

      const foundBabelRCPath = possibleBabelRCPaths.find((configFileName) =>
        fs.existsSync(path.resolve(projectRoot, configFileName))
      );

      // Extend the config if a babel config file is found
      if (foundBabelRCPath) {
        babelRC.extends = path.resolve(projectRoot, foundBabelRCPath);
      }
    }

    // Use the default preset for react-native if no babel config file is found
    if (!babelRC.extends) {
      babelRC.presets = [require('babel-preset-expo')];
    }

    return babelRC;
  };
})();

function isCustomTruthy(value: any): boolean {
  return value === true || value === 'true';
}

const transform: BabelTransformer['transform'] = ({
  filename,
  src,
  options,
  // `plugins` is used for `functionMapBabelPlugin` from `metro-source-map`. Could make sense to move this to `babel-preset-expo` too.
  plugins,
}: BabelTransformerArgs): ReturnType<BabelTransformer['transform']> => {
  const OLD_BABEL_ENV = process.env.BABEL_ENV;
  process.env.BABEL_ENV = options.dev ? 'development' : process.env.BABEL_ENV || 'production';

  try {
    const isNodeModule = filename.includes('node_modules');
    const isServer = options.customTransformOptions?.environment === 'node';
    const babelConfig: TransformOptions = {
      // ES modules require sourceType='module' but OSS may not always want that
      sourceType: 'unambiguous',

      // The output we want from Babel methods
      ast: true,
      code: false,
      // NOTE(EvanBacon): We split the parse/transform steps up to accommodate
      // Hermes parsing, but this defaults to cloning the AST which increases
      // the transformation time by a fair amount.
      // You get this behavior by default when using Babel's `transform` method directly.
      cloneInputAst: false,

      // Options for debugging
      cwd: options.projectRoot,
      filename,
      highlightCode: true,

      // Load the project babel config file.
      ...getBabelRC(options),

      babelrc:
        typeof options.enableBabelRCLookup === 'boolean' ? options.enableBabelRCLookup : true,

      plugins,

      // NOTE(EvanBacon): We heavily leverage the caller functionality to mutate the babel config.
      // This compensates for the lack of a format plugin system in Metro. Users can modify the
      // all (most) of the transforms in their local Babel config.
      // This also helps us keep the transform layers small and focused on a single task. We can also use this to
      // ensure the Babel config caching is more accurate.
      // Additionally, by moving everything Babel-related to the Babel preset, it makes it easier for users to reason
      // about the requirements of an Expo project, making it easier to migrate to other transpilers in the future.
      caller: {
        name: 'metro',
        // @ts-expect-error: Custom values passed to the caller.
        bundler: 'metro',
        platform: options.platform,
        // Empower the babel preset to know the env it's bundling for.
        // Metro automatically updates the cache to account for the custom transform options.
        isServer,

        // The base url to make requests from, used for hosting from non-standard locations.
        baseUrl:
          typeof options.customTransformOptions?.baseUrl === 'string'
            ? decodeURI(options.customTransformOptions.baseUrl)
            : '',

        isDev: options.dev,

        // This value indicates if the user has disabled the feature or not.
        // Other criteria may still cause the feature to be disabled, but all inputs used are
        // already considered in the cache key.
        preserveEnvVars: isCustomTruthy(options.customTransformOptions?.preserveEnvVars)
          ? true
          : undefined,
        // Pass the engine to babel so we can automatically transpile for the correct
        // target environment.
        engine: options.customTransformOptions?.engine,

        // Provide the project root for accurately reading the Expo config.
        projectRoot: options.projectRoot,

        isNodeModule,

        isHMREnabled: options.hot,
      },
    };

    const useBabelCore =
      isTypeScriptSource(filename) || isTSXSource(filename) || !options.hermesParser;
    const parser = useBabelCore ? parseWithBabel : parseWithHermes;

    const result = parser(src, babelConfig);

    // The result from `transformFromAstSync` can be null (if the file is ignored)
    if (!result) {
      // BabelTransformer specifies that the `ast` can never be null but
      // the function returns here. Discovered when typing `BabelNode`.
      return { ast: null };
    }

    assert(result.ast);
    return { ast: result.ast, metadata: result.metadata };
  } finally {
    if (OLD_BABEL_ENV) {
      process.env.BABEL_ENV = OLD_BABEL_ENV;
    }
  }
};

function parseWithHermes(src: string, babelConfig: TransformOptions) {
  const sourceAst = require('hermes-parser').parse(src, {
    babel: true,
    sourceType: babelConfig.sourceType,
  });
  return transformFromAstSync(sourceAst, src, babelConfig);
}

function parseWithBabel(src: string, babelConfig: TransformOptions) {
  return transformSync(src, babelConfig);
}

function getCacheKey() {
  const key = crypto.createHash('md5');
  cacheKeyParts.forEach((part) => key.update(part));
  return key.digest('hex');
}

const babelTransformer: BabelTransformer = {
  transform,
  getCacheKey,
};

module.exports = babelTransformer;
