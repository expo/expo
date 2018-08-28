/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Note: This is a fork of the fb-specific transform.js
 */
'use strict';

/**
 * [Expo] This transformer was based on React Native's transformer with the
 * following changes:
 *   - Makes the packager use react-native-lab's copy of react-native
 *   - Rewrites the paths of this module's dependencies so we load the
 *     dependencies from react-native-lab's copy of react-native, to simulate
 *     if we hadn't forked the transformer at all
 */
/*eslint-disable import/order */

const babel = require('./react-native/node_modules/babel-core');
const crypto = require('crypto');
const externalHelpersPlugin = require('./react-native/node_modules/babel-plugin-external-helpers');
const fs = require('fs');
const inlineRequiresPlugin = require('./react-native/node_modules/babel-preset-fbjs/plugins/inline-requires');
const makeHMRConfig = require('./react-native/node_modules/babel-preset-react-native/configs/hmr');
const path = require('path');

const cacheKeyParts = [
  fs.readFileSync(__filename),
  require('./react-native/node_modules/babel-plugin-external-helpers/package.json').version,
  require('./react-native/node_modules/babel-preset-fbjs/package.json').version,
  require('./react-native/node_modules/babel-preset-react-native/package.json').version,
];

/**
 * Given a filename and options, build a Babel
 * config object with the appropriate plugins.
 */
function buildBabelConfig(filename, options, plugins = []) {
  // [Expo] We create the Babel configuration here instead of loading babelrc
  const babelRC = {
    presets: [require('babel-preset-expo'), buildModuleResolverPreset()],
    plugins: [],
  };

  const extraConfig = {
    babelrc: typeof options.enableBabelRCLookup === 'boolean' ? options.enableBabelRCLookup : true,
    code: false,
    filename,
  };

  let config = Object.assign({}, babelRC, extraConfig);

  // Add extra plugins
  const extraPlugins = [externalHelpersPlugin];

  if (options.inlineRequires) {
    extraPlugins.push(inlineRequiresPlugin);
  }

  config.plugins = extraPlugins.concat(config.plugins, plugins);

  if (options.dev && options.hot) {
    const hmrConfig = makeHMRConfig(options, filename);
    config = Object.assign({}, config, hmrConfig);
  }

  return Object.assign({}, babelRC, config);
}

function transform({ filename, options, src, plugins }) {
  options = options || {
    platform: '',
    projectRoot: '',
    inlineRequires: false,
    minify: false,
  };

  const OLD_BABEL_ENV = process.env.BABEL_ENV;
  process.env.BABEL_ENV = options.dev ? 'development' : 'production';

  try {
    const babelConfig = buildBabelConfig(filename, options, plugins);
    const { ast } = babel.transform(src, babelConfig);

    return { ast };
  } finally {
    process.env.BABEL_ENV = OLD_BABEL_ENV;
  }
}

function getCacheKey() {
  var key = crypto.createHash('md5');
  cacheKeyParts.forEach(part => key.update(part));
  return key.digest('hex');
}

/**
 * [Expo] Returns an Expo-internal Babel preset for aliasing react-native and
 * react imports
 */
function buildModuleResolverPreset() {
  const expoReactNativePath = path.join(__dirname, 'react-native');
  const expoReactPath = path.join(expoReactNativePath, 'node_modules/react');
  return {
    plugins: [
      [
        require('babel-plugin-module-resolver').default,
        {
          alias: {
            react: expoReactPath,
            'react-native': expoReactNativePath,
          },
        },
      ],
    ],
  };
}

module.exports = {
  transform,
  getCacheKey,
};
