/**
 * Copyright (c) 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// A fork of the upstream babel-transformer that uses Expo-specific babel defaults
// and adds support for web and Node.js environments via `isServer` on the Babel caller.

// @ts-expect-error
import makeHMRConfig from '@react-native/babel-preset/src/configs/hmr';
// @ts-expect-error
import inlineRequiresPlugin from 'babel-preset-fbjs/plugins/inline-requires';
import type { BabelTransformer, BabelTransformerArgs } from 'metro-babel-transformer';
import assert from 'node:assert';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import resolveFrom from 'resolve-from';

import {
  parseSync,
  type PluginItem,
  type TransformOptions,
  transformFromAstSync,
} from './babel-core';

const cacheKeyParts = [
  fs.readFileSync(__filename),
  require('babel-preset-fbjs/package.json').version,
];

// TS detection conditions copied from @react-native/babel-preset
function isTypeScriptSource(fileName: string): boolean {
  return !!fileName && fileName.endsWith('.ts');
}

function isTSXSource(fileName: string): boolean {
  return !!fileName && fileName.endsWith('.tsx');
}

let babelPresetExpo: string | null | undefined = null;

function getBabelPresetExpo(projectRoot: string): string | null {
  if (babelPresetExpo !== undefined) {
    return babelPresetExpo;
  }

  babelPresetExpo = resolveFrom.silent(projectRoot, 'babel-preset-expo') ?? null;
  return babelPresetExpo;
}

/**
 * Return a memoized function that checks for the existence of a
 * project level .babelrc file, and if it doesn't exist, reads the
 * default RN babelrc file and uses that.
 */
const getBabelRC = (function () {
  let babelRC: TransformOptions | null /*: ?BabelCoreOptions */ = null;

  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  return function _getBabelRC({
    projectRoot,
    extendsBabelConfigPath,
    ...options
  }: BabelTransformerArgs['options']) {
    if (babelRC != null) {
      return babelRC;
    }

    babelRC = {
      plugins: [],
      extends: extendsBabelConfigPath,
    };

    if (extendsBabelConfigPath) {
      return babelRC;
    }

    // Let's look for a babel config file in the project root.
    let projectBabelRCPath;

    // .babelrc
    if (projectRoot) {
      projectBabelRCPath = path.resolve(projectRoot, '.babelrc');
    }

    if (projectBabelRCPath) {
      // .babelrc.js
      if (!fs.existsSync(projectBabelRCPath)) {
        projectBabelRCPath = path.resolve(projectRoot, '.babelrc.js');
      }

      // babel.config.js
      if (!fs.existsSync(projectBabelRCPath)) {
        projectBabelRCPath = path.resolve(projectRoot, 'babel.config.js');
      }

      // If we found a babel config file, extend our config off of it
      // otherwise the default config will be used
      if (fs.existsSync(projectBabelRCPath)) {
        babelRC.extends = projectBabelRCPath;
      }
    }

    // If a babel config file doesn't exist in the project then
    // the default preset for react-native will be used instead.
    if (!babelRC.extends) {
      const { experimentalImportSupport, ...presetOptions } = options;

      // Convert the options into the format expected by the Expo preset.
      const platformOptions = {
        // @ts-expect-error: This is how Metro works by default
        unstable_transformProfile: presetOptions.unstable_transformProfile,
        disableImportExportTransform: experimentalImportSupport,
        dev: presetOptions.dev,
        enableBabelRuntime: presetOptions.enableBabelRuntime,
      };

      babelRC.presets = [
        [
          // NOTE(EvanBacon): Here we use the Expo babel wrapper instead of the default react-native preset.
          require('babel-preset-expo'),
          {
            web: platformOptions,
            native: platformOptions,
            // lazyImports: presetOptions.lazyImportExportTransform,
          },
        ],
      ];
    }

    return babelRC;
  };
})();

/**
 * Given a filename and options, build a Babel
 * config object with the appropriate plugins.
 */
function buildBabelConfig(
  filename: string,
  options: BabelTransformerArgs['options'],
  plugins: PluginItem[] = []
): TransformOptions {
  const babelRC = getBabelRC(options);

  const extraConfig: TransformOptions = {
    babelrc: typeof options.enableBabelRCLookup === 'boolean' ? options.enableBabelRCLookup : true,
    code: false,
    cwd: options.projectRoot,
    filename,
    highlightCode: true,
  };

  let config: TransformOptions = {
    ...babelRC,
    ...extraConfig,
  };

  // Add extra plugins
  const extraPlugins = [];

  if (options.inlineRequires) {
    extraPlugins.push(inlineRequiresPlugin);
  }

  config.plugins = extraPlugins.concat(config.plugins, plugins);

  const withExtraPlugins = config.plugins;

  if (options.dev && options.hot) {
    // Note: this intentionally doesn't include the path separator because
    // I'm not sure which one it should use on Windows, and false positives
    // are unlikely anyway. If you later decide to include the separator,
    // don't forget that the string usually *starts* with "node_modules" so
    // the first one often won't be there.
    const mayContainEditableReactComponents = !filename.includes('node_modules');

    if (mayContainEditableReactComponents) {
      const hmrConfig = makeHMRConfig();
      hmrConfig.plugins = withExtraPlugins.concat(hmrConfig.plugins);
      config = { ...config, ...hmrConfig };
    }
  }

  return {
    ...babelRC,
    ...config,
  };
}

function isCustomTruthy(value: any): boolean {
  return value === true || value === 'true';
}

const transform: BabelTransformer['transform'] = ({
  filename,
  options,
  src,
  plugins,
}: BabelTransformerArgs): ReturnType<BabelTransformer['transform']> => {
  const OLD_BABEL_ENV = process.env.BABEL_ENV;
  process.env.BABEL_ENV = options.dev ? 'development' : process.env.BABEL_ENV || 'production';

  // Ensure the default babel preset is Expo.
  options.extendsBabelConfigPath = getBabelPresetExpo(options.projectRoot) ?? undefined;

  try {
    const babelConfig: TransformOptions = {
      // ES modules require sourceType='module' but OSS may not always want that
      sourceType: 'unambiguous',
      ...buildBabelConfig(filename, options, plugins),
      caller: {
        name: 'metro',
        // @ts-expect-error: Custom values passed to the caller.
        bundler: 'metro',
        platform: options.platform,
        // Empower the babel preset to know the env it's bundling for.
        // Metro automatically updates the cache to account for the custom transform options.
        isServer: options.customTransformOptions?.environment === 'node',

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
      },
      ast: true,

      // NOTE(EvanBacon): We split the parse/transform steps up to accommodate
      // Hermes parsing, but this defaults to cloning the AST which increases
      // the transformation time by a fair amount.
      // You get this behavior by default when using Babel's `transform` method directly.
      cloneInputAst: false,
    };
    const sourceAst =
      isTypeScriptSource(filename) || isTSXSource(filename) || !options.hermesParser
        ? parseSync(src, babelConfig)
        : require('hermes-parser').parse(src, {
            babel: true,
            sourceType: babelConfig.sourceType,
          });

    const result = transformFromAstSync(sourceAst, src, babelConfig);

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
