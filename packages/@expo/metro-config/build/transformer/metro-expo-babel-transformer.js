"use strict";

function _resolveFrom() {
  const data = _interopRequireDefault(require("resolve-from"));

  _resolveFrom = function () {
    return data;
  };

  return data;
}

function _getCacheKey() {
  const data = require("./getCacheKey");

  _getCacheKey = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Copyright 2021-present 650 Industries (Expo). All rights reserved.
let transformer = null;

function resolveTransformer(projectRoot) {
  if (transformer) {
    return transformer;
  }

  const resolvedPath = _resolveFrom().default.silent(projectRoot, 'metro-react-native-babel-transformer');

  if (!resolvedPath) {
    throw new Error('Missing package "metro-react-native-babel-transformer" in the project. ' + 'This usually means `react-native` is not installed. ' + 'Please verify that dependencies in package.json include "react-native" ' + 'and run `yarn` or `npm install`.');
  }

  transformer = require(resolvedPath);
  return transformer;
}
/**
 * Extends the default `metro-react-native-babel-transformer`
 * and uses babel-preset-expo as the default instead of metro-react-native-babel-preset.
 * This enables users to safely transpile an Expo project without
 * needing to explicitly define a `babel.config.js`
 *
 * @param filename string
 * @param options BabelTransformerOptions
 * @param plugins $PropertyType<BabelCoreOptions, 'plugins'>
 * @param src string
 *
 * @returns
 */


function transform(props) {
  // Use babel-preset-expo by default if available...
  props.options.extendsBabelConfigPath = _resolveFrom().default.silent(props.options.projectRoot, 'babel-preset-expo');
  return resolveTransformer(props.options.projectRoot).transform(props);
}

module.exports = {
  getCacheKey: _getCacheKey().getCacheKey,
  transform
};
//# sourceMappingURL=metro-expo-babel-transformer.js.map