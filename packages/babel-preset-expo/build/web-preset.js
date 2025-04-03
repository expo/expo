"use strict";
/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * A fork of `@react-native/babel-preset` but with everything unrelated to web/ssr removed.
 * https://github.com/facebook/react-native/blob/2af1da42ff517232f1309efed7565fe9ddbbac77/packages/react-native-babel-preset/src/configs/main.js#L1
 */
Object.defineProperty(exports, "__esModule", { value: true });
// use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
const loose = true;
const defaultPlugins = [
    // This is required for parsing React Native with RSC enabled :/
    [require('babel-plugin-syntax-hermes-parser'), { parseLangTypes: 'flow' }],
    //
    [require('babel-plugin-transform-flow-enums')],
    [require('@babel/plugin-transform-private-methods'), { loose }],
    [require('@babel/plugin-transform-private-property-in-object'), { loose }],
    [require('@babel/plugin-syntax-export-default-from')],
    [require('@babel/plugin-transform-export-namespace-from')],
];
module.exports = function (babel, options) {
    const extraPlugins = [];
    // NOTE: We also remove `@react-native/babel-plugin-codegen` since it doesn't seem needed on web.
    if (!options || !options.disableImportExportTransform) {
        extraPlugins.push([require('@babel/plugin-proposal-export-default-from')], [
            require('@babel/plugin-transform-modules-commonjs'),
            {
                strict: false,
                strictMode: false,
                lazy: options.lazyImportExportTransform,
                allowTopLevelThis: true, // dont rewrite global `this` -> `undefined`
            },
        ]);
    }
    if (!options || options.enableBabelRuntime !== false) {
        // Allows configuring a specific runtime version to optimize output
        const isVersion = typeof options?.enableBabelRuntime === 'string';
        extraPlugins.push([
            require('@babel/plugin-transform-runtime'),
            {
                helpers: true,
                regenerator: false,
                ...(isVersion && { version: options.enableBabelRuntime }),
            },
        ]);
    }
    return {
        comments: false,
        compact: true,
        presets: [
            // TypeScript support
            [require('@babel/preset-typescript'), { allowNamespaces: true }],
        ],
        overrides: [
            // the flow strip types plugin must go BEFORE class properties!
            // there'll be a test case that fails if you don't.
            {
                plugins: [require('@babel/plugin-transform-flow-strip-types')],
            },
            {
                plugins: defaultPlugins,
            },
            {
                plugins: extraPlugins,
            },
        ],
    };
};
