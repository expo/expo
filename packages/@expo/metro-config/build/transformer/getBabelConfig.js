"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBabelConfig = getBabelConfig;
function _fs() {
  const data = _interopRequireDefault(require("fs"));
  _fs = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _resolveFrom() {
  const data = _interopRequireDefault(require("resolve-from"));
  _resolveFrom = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Copyright (c) Expo.
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Forks the default metro-react-native-babel-transformer and adds support for known transforms.
 */

/**
 * Return a memoized function that checks for the existence of a
 * project level .babelrc file, and if it doesn't exist, reads the
 * default RN babelrc file and uses that.
 */
const getBabelRC = function () {
  let babelRC = null;
  return function _getBabelRC(projectRoot, options) {
    if (babelRC != null) {
      return babelRC;
    }
    babelRC = {
      plugins: []
    };

    // Let's look for a babel config file in the project root.
    // TODO look into adding a command line option to specify this location
    let projectBabelRCPath;

    // .babelrc
    if (projectRoot) {
      projectBabelRCPath = _path().default.resolve(projectRoot, '.babelrc');
    }
    if (projectBabelRCPath) {
      // .babelrc.js
      if (!_fs().default.existsSync(projectBabelRCPath)) {
        projectBabelRCPath = _path().default.resolve(projectRoot, '.babelrc.js');
      }

      // babel.config.js
      if (!_fs().default.existsSync(projectBabelRCPath)) {
        projectBabelRCPath = _path().default.resolve(projectRoot, 'babel.config.js');
      }

      // If we found a babel config file, extend our config off of it
      // otherwise the default config will be used
      if (_fs().default.existsSync(projectBabelRCPath)) {
        babelRC.extends = projectBabelRCPath;
      }
    }

    // If a babel config file doesn't exist in the project then
    // the default preset for react-native will be used instead.
    if (!babelRC.extends) {
      var _ref, _resolveFrom$silent;
      const {
        experimentalImportSupport,
        ...presetOptions
      } = options;

      // Use `babel-preset-expo` instead of `@react-native/babel-preset`.
      const presetPath = (_ref = (_resolveFrom$silent = _resolveFrom().default.silent(projectRoot, 'babel-preset-expo')) !== null && _resolveFrom$silent !== void 0 ? _resolveFrom$silent : _resolveFrom().default.silent(projectRoot, '@react-native/babel-preset')) !== null && _ref !== void 0 ? _ref : require.resolve('babel-preset-expo');
      babelRC.presets = [[require(presetPath), {
        // Default to React 17 automatic JSX transform.
        jsxRuntime: 'automatic',
        ...presetOptions,
        disableImportExportTransform: experimentalImportSupport,
        enableBabelRuntime: options.enableBabelRuntime
      }]];
    }
    return babelRC;
  };
}();

/**
 * Given a filename and options, build a Babel
 * config object with the appropriate plugins.
 */
function getBabelConfig(filename, options, plugins = []) {
  const babelRC = getBabelRC(options.projectRoot, options);
  const extraConfig = {
    babelrc: typeof options.enableBabelRCLookup === 'boolean' ? options.enableBabelRCLookup : true,
    code: false,
    filename,
    highlightCode: true
  };
  const config = {
    ...babelRC,
    ...extraConfig
  };

  // Add extra plugins
  const extraPlugins = [];

  // TODO: This probably can be removed
  if (options.inlineRequires) {
    const inlineRequiresPlugin = (0, _resolveFrom().default)(options.projectRoot, 'babel-preset-fbjs/plugins/inline-requires');
    extraPlugins.push(inlineRequiresPlugin);
  }
  config.plugins = extraPlugins.concat(config.plugins, plugins);
  if (options.dev && options.hot) {
    // Note: this intentionally doesn't include the path separator because
    // I'm not sure which one it should use on Windows, and false positives
    // are unlikely anyway. If you later decide to include the separator,
    // don't forget that the string usually *starts* with "node_modules" so
    // the first one often won't be there.
    // TODO: Support monorepos
    const mayContainEditableReactComponents = filename.indexOf('node_modules') === -1;
    if (mayContainEditableReactComponents) {
      if (!config.plugins) {
        config.plugins = [];
      }
      // Add react refresh runtime.
      // NOTICE: keep in sync with '@react-native/babel-preset/src/configs/hmr'.
      config.plugins.push(_resolveFrom().default.silent(options.projectRoot, 'react-refresh/babel'));
    }
  }
  return {
    ...babelRC,
    ...config
  };
}
//# sourceMappingURL=getBabelConfig.js.map