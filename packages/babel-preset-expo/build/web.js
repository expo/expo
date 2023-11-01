"use strict";
/**
 * Copyright © 2023-present 650 Industries, Inc. (aka Expo)
 * Copyright © Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.babelPresetExpoWeb = void 0;
const common_1 = require("./common");
const expo_inline_manifest_plugin_1 = require("./expo-inline-manifest-plugin");
function babelPresetExpoWeb(api, options = {}) {
    const bundler = api.caller(common_1.getBundler);
    const isWebpack = bundler === 'webpack';
    const platformOptions = {
        // Only disable import/export transform when Webpack is used because
        // Metro does not support tree-shaking.
        disableImportExportTransform: isWebpack,
        ...options.web,
    };
    const metroOptions = options.web;
    const extraPlugins = [
        require('babel-plugin-react-native-web'),
        require('@babel/plugin-syntax-export-default-from'),
    ];
    // Webpack uses the DefinePlugin to provide the manifest to `expo-constants`.
    if (bundler !== 'webpack') {
        extraPlugins.push(expo_inline_manifest_plugin_1.expoInlineManifestPlugin);
    }
    if (metroOptions?.enableBabelRuntime !== false) {
        // Allows configuring a specific runtime version to optimize output
        const isVersion = typeof metroOptions?.enableBabelRuntime === 'string';
        extraPlugins.push([
            require('@babel/plugin-transform-runtime'),
            {
                corejs: false,
                helpers: true,
                regenerator: true,
                ...(isVersion && {
                    version: metroOptions.enableBabelRuntime,
                }),
            },
        ]);
    }
    return {
        comments: false,
        compact: true,
        presets: [
            [
                require('@babel/preset-env'),
                {
                    modules: platformOptions.disableImportExportTransform ? false : 'commonjs',
                    exclude: ['transform-typeof-symbol'],
                },
            ],
            // TypeScript support
            [require('@babel/preset-typescript'), { allowNamespaces: true }],
        ],
        // React Native legacy transforms for flow and TypeScript
        overrides: [
            // the flow strip types plugin must go BEFORE class properties!
            // there'll be a test case that fails if you don't.
            {
                test: (filename) => !platformOptions.disableFlowStripTypesTransform &&
                    (filename == null || !/\.tsx?$/.test(filename)),
                plugins: [
                    require('@babel/plugin-transform-flow-strip-types'),
                    require('babel-plugin-transform-flow-enums'),
                ],
            },
            // Additional features
            {
                plugins: extraPlugins,
            },
        ],
    };
}
exports.babelPresetExpoWeb = babelPresetExpoWeb;
