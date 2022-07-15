"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createExoticTransformer = createExoticTransformer;

function _createMatcher() {
  const data = require("./createMatcher");

  _createMatcher = function () {
    return data;
  };

  return data;
}

function _createMultiRuleTransformer() {
  const data = require("./createMultiRuleTransformer");

  _createMultiRuleTransformer = function () {
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

// Copyright 2021-present 650 Industries (Expo). All rights reserved.

/**
 * Create an experimental multi-rule transformer for a React Native app.
 *
 * @example
 * ```
 * module.exports = createExoticTransformer({
 *    nodeModulesPaths: ['react-native'],
 *    transpileModules: ['@stripe/stripe-react-native'],
 * });
 * ```
 *
 * @param props.nodeModulesPaths paths to node_modules folders, relative to project root. Default: `['node_modules']`
 * @param props.transpileModules matchers for module names that should be transpiled using the project Babel configuration. Example: `['@stripe/stripe-react-native']`
 * @returns a Metro `transformer` function and default `getCacheKey` function.
 */
function createExoticTransformer({
  nodeModulesPaths,
  transpileModules
}) {
  if (!nodeModulesPaths) {
    nodeModulesPaths = ['node_modules'];
  } // Match any node modules, or monorepo module.


  const nodeModuleMatcher = (0, _createMatcher().createModuleMatcher)({
    folders: nodeModulesPaths,
    moduleIds: []
  }); // Match node modules which are so oddly written that we must
  // transpile them with every possible option (most expensive).

  const impossibleNodeModuleMatcher = (0, _createMatcher().createModuleMatcher)({
    moduleIds: [// victory is too wild
    // SyntaxError in ../../node_modules/victory-native/lib/components/victory-primitives/bar.js: Missing semicolon. (9:1)
    'victory', // vector icons has some hidden issues that break NCL
    '@expo/vector-icons', ...(transpileModules || [])],
    folders: nodeModulesPaths
  });
  const transform = (0, _createMultiRuleTransformer().createMultiRuleTransformer)({
    // Specify which rules to use on a per-file basis, basically
    // this is used to determine which modules are node modules, and which are application code.
    getRuleType({
      filename
    }) {
      // Is a node module, and is not one of the impossible modules.
      return nodeModuleMatcher.test(filename) && !impossibleNodeModuleMatcher.test(filename) ? 'module' : 'app';
    },

    // Order is very important, we use wild card matchers to transpile
    // "every unhandled node module" and "every unhandled application module".
    rules: [// Match bob compiler modules, use the passthrough loader.
    {
      name: 'bob',
      type: 'module',
      test: (0, _createMatcher().createModuleMatcher)({
        moduleIds: ['.*/lib/commonjs/'],
        folders: nodeModulesPaths
      }),
      transform: _createMultiRuleTransformer().loaders.passthroughModule,
      warn: true
    }, // Match React Native modules, convert them statically using sucrase.
    {
      name: 'react-native',
      type: 'module',
      test: (0, _createMatcher().createReactNativeMatcher)({
        folders: nodeModulesPaths
      }),
      transform: _createMultiRuleTransformer().loaders.reactNativeModule,
      warn: true
    }, // Match Expo SDK modules, convert them statically using sucrase.
    {
      name: 'expo-module',
      type: 'module',
      test: (0, _createMatcher().createExpoMatcher)({
        folders: nodeModulesPaths
      }),
      transform: _createMultiRuleTransformer().loaders.expoModule,
      warn: true
    }, // Match known problematic modules, convert them statically using an expensive, dynamic sucrase.
    {
      name: 'sucrase',
      type: 'module',
      test: (0, _createMatcher().createKnownCommunityMatcher)({
        folders: nodeModulesPaths
      }),
      transform: _createMultiRuleTransformer().loaders.untranspiledModule,
      warn: true
    }, // Pass through any unhandled node modules as passthrough, this is where the most savings occur.
    // Ideally, you want your project to pass all node modules through this loader.
    // This should be the last "module" rule.
    // Message library authors and ask them to ship their modules as pre-transpiled
    // commonjs, to improve the development speed of your project.
    {
      name: 'skip-module',
      type: 'module',
      test: () => true,
      transform: _createMultiRuleTransformer().loaders.passthroughModule
    }, // All application code should be transpiled with the user's babel preset,
    // this is the most expensive operation but provides the most customization to the user.
    // The goal is to use this as sparingly as possible.
    {
      name: 'babel',
      test: () => true,
      transform: _createMultiRuleTransformer().loaders.app
    }]
  });
  return {
    transform,
    getCacheKey: _getCacheKey().getCacheKey
  };
}
//# sourceMappingURL=createExoticTransformer.js.map