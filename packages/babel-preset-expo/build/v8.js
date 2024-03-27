"use strict";
/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
function isTypeScriptSource(fileName) {
    return !!fileName && fileName.endsWith('.ts');
}
function isTSXSource(fileName) {
    return !!fileName && fileName.endsWith('.tsx');
}
// use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
const loose = true;
const defaultPlugins = [
    [require('@babel/plugin-syntax-flow')],
    [require('babel-plugin-transform-flow-enums')],
    [require('@babel/plugin-proposal-class-properties'), { loose }],
    [require('@babel/plugin-transform-private-methods'), { loose }],
    [require('@babel/plugin-transform-private-property-in-object'), { loose }],
    [require('@babel/plugin-syntax-dynamic-import')],
    [require('@babel/plugin-syntax-export-default-from')],
    [require('@babel/plugin-syntax-nullish-coalescing-operator')],
    [require('@babel/plugin-syntax-optional-chaining')],
    //   [require('@babel/plugin-transform-unicode-regex')],
];
module.exports = function (babel, options) {
    const extraPlugins = [];
    if (!options.disableStaticViewConfigsCodegen) {
        extraPlugins.push([require('@react-native/babel-plugin-codegen')]);
    }
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
    // TODO(gaearon): put this back into '=>' indexOf bailout
    // and patch react-refresh to not depend on this transform.
    extraPlugins.push([require('@babel/plugin-transform-arrow-functions')]);
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
                test: isTypeScriptSource,
                plugins: [
                    [
                        require('@babel/plugin-transform-typescript'),
                        {
                            isTSX: false,
                            allowNamespaces: true,
                        },
                    ],
                ],
            },
            {
                test: isTSXSource,
                plugins: [
                    [
                        require('@babel/plugin-transform-typescript'),
                        {
                            isTSX: true,
                            allowNamespaces: true,
                        },
                    ],
                ],
            },
            {
                plugins: extraPlugins,
            },
        ],
    };
};
