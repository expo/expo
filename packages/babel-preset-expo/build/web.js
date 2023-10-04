"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.babelPresetExpoWeb = void 0;
const common_1 = require("./common");
function babelPresetExpoWeb(api, options = {}) {
    const isDev = api.caller(common_1.getIsDev);
    const bundler = api.caller(common_1.getBundler);
    const isWebpack = bundler === 'webpack';
    const platformOptions = {
        // Only disable import/export transform when Webpack is used because
        // Metro does not support tree-shaking.
        disableImportExportTransform: isWebpack,
        unstable_transformProfile: 'default',
        ...options.web,
    };
    const metroOptions = options.web;
    const extraPlugins = [require('babel-plugin-react-native-web')];
    if (metroOptions?.enableBabelRuntime !== false) {
        // Allows configuring a specific runtime version to optimize output
        const isVersion = typeof metroOptions?.enableBabelRuntime === 'string';
        extraPlugins.push([
            require('@babel/plugin-transform-runtime'),
            {
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
                },
            ],
            // React support with similar options to Metro.
            [
                require('@babel/preset-react'),
                {
                    // Defaults to `automatic`, pass in `classic` to disable auto JSX transformations.
                    runtime: options?.jsxRuntime || 'automatic',
                    ...(options &&
                        options.jsxRuntime !== 'classic' && {
                        importSource: (options && options.jsxImportSource) || 'react',
                    }),
                    development: isDev,
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
                test: (filename) => filename == null || !/\.tsx?$/.test(filename),
                plugins: [
                    require('@babel/plugin-transform-flow-strip-types'),
                    require('babel-plugin-transform-flow-enums'),
                ],
            },
            // Additional features
            {
                plugins: [
                    require('@babel/plugin-syntax-dynamic-import'),
                    require('@babel/plugin-syntax-export-default-from'),
                    require('@babel/plugin-transform-spread'),
                    [
                        require('@babel/plugin-proposal-object-rest-spread'),
                        // Assume no dependence on getters or evaluation order. See https://github.com/babel/babel/pull/11520
                        {
                            loose: true,
                            useBuiltIns: true,
                        },
                    ],
                ],
            },
            {
                plugins: extraPlugins,
            },
        ],
    };
}
exports.babelPresetExpoWeb = babelPresetExpoWeb;
