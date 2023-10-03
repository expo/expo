"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.babelPresetExpoWeb = void 0;
const lazyImports = require('./lazy-imports');
function isTypeScriptSource(fileName) {
    return !!fileName && fileName.endsWith('.ts');
}
function isTSXSource(fileName) {
    return !!fileName && fileName.endsWith('.tsx');
}
const defaultPlugins = [
    require('@babel/plugin-syntax-flow'),
    require('babel-plugin-transform-flow-enums'),
    require('@babel/plugin-transform-block-scoping'),
    [
        require('@babel/plugin-proposal-class-properties'),
        // use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
        {
            loose: true,
        },
    ],
    require('@babel/plugin-syntax-dynamic-import'),
    require('@babel/plugin-syntax-export-default-from'),
    require('@babel/plugin-transform-unicode-regex'),
];
const getPreset = (src, options) => {
    const transformProfile = (options && options.unstable_transformProfile) || 'default';
    const isHermesCanary = transformProfile === 'hermes-canary';
    const isNull = src == null;
    const hasClass = isNull || src.indexOf('class') !== -1;
    const extraPlugins = [];
    if (!options.useTransformReactJSXExperimental) {
        extraPlugins.push([
            require('@babel/plugin-transform-react-jsx'),
            {
                runtime: 'automatic',
            },
        ]);
    }
    if (!options || !options.disableImportExportTransform) {
        extraPlugins.push([require('@babel/plugin-proposal-export-default-from')], [
            require('@babel/plugin-transform-modules-commonjs'),
            {
                strict: false,
                strictMode: false,
                // prevent "use strict" injections
                lazy: options && options.lazyImportExportTransform != null
                    ? options.lazyImportExportTransform
                    : (importSpecifier) => lazyImports.has(importSpecifier),
                allowTopLevelThis: true, // dont rewrite global `this` -> `undefined`
            },
        ]);
    }
    if (hasClass) {
        extraPlugins.push([require('@babel/plugin-transform-classes')]);
    }
    // TODO(gaearon): put this back into '=>' indexOf bailout
    // and patch react-refresh to not depend on this transform.
    extraPlugins.push([require('@babel/plugin-transform-arrow-functions')]);
    extraPlugins.push([require('@babel/plugin-transform-named-capturing-groups-regex')]);
    if (!isHermesCanary) {
        extraPlugins.push([
            require('@babel/plugin-transform-destructuring'),
            {
                useBuiltIns: true,
            },
        ]);
    }
    if (isNull || src.indexOf('async') !== -1) {
        extraPlugins.push(require('@babel/plugin-proposal-async-generator-functions'), require('@babel/plugin-transform-async-to-generator'));
    }
    if (isNull || src.indexOf('React.createClass') !== -1 || src.indexOf('createReactClass') !== -1) {
        extraPlugins.push(require('@babel/plugin-transform-react-display-name'));
    }
    if (options?.dev && !options.useTransformReactJSXExperimental) {
        extraPlugins.push(require('@babel/plugin-transform-react-jsx-source'));
        extraPlugins.push(require('@babel/plugin-transform-react-jsx-self'));
    }
    if (!options || options.enableBabelRuntime !== false) {
        // Allows configuring a specific runtime version to optimize output
        const isVersion = typeof options?.enableBabelRuntime === 'string';
        extraPlugins.push([
            require('@babel/plugin-transform-runtime'),
            {
                helpers: true,
                regenerator: false,
                ...(isVersion && {
                    version: options.enableBabelRuntime,
                }),
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
module.exports = (options) => {
    if (options.withDevTools == null) {
        const env = process.env.BABEL_ENV || process.env.NODE_ENV;
        if (!env || env === 'development') {
            return getPreset(null, {
                ...options,
                dev: true,
            });
        }
    }
    return getPreset(null, options);
};
module.exports.getPreset = getPreset;
function babelPresetExpoWeb(api, options = {}) {
    const metroOptions = options.web;
    const extraPlugins = [];
    if (metroOptions?.enableBabelRuntime !== false) {
        // Allows configuring a specific runtime version to optimize output
        const isVersion = typeof metroOptions?.enableBabelRuntime === 'string';
        extraPlugins.push([
            require('@babel/plugin-transform-runtime'),
            {
                corejs: false,
                helpers: true,
                regenerator: true,
                // useESModules: supportsESM && presetEnvConfig.modules !== 'commonjs',
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
                    // In the test environment `modules` is often needed to be set to true, babel figures that out by itself using the `'auto'` option
                    // In production/development this option is set to `false` so that webpack can handle import/export with tree-shaking
                    modules: 'auto',
                },
            ],
            [
                require('@babel/preset-react'),
                {
                    // Defaults to `automatic`, pass in `classic` to disable auto JSX transformations.
                    runtime: options?.jsxRuntime || 'automatic',
                    ...(options &&
                        options.jsxRuntime !== 'classic' && {
                        importSource: (options && options.jsxImportSource) || 'react',
                    }),
                    development: process.env.BABEL_ENV === 'development' || process.env.NODE_ENV === 'development',
                },
            ],
        ],
        // React Native legacy transforms for flow and TypeScript
        overrides: [
            // the flow strip types plugin must go BEFORE class properties!
            // there'll be a test case that fails if you don't.
            {
                plugins: [
                    require('@babel/plugin-syntax-flow'),
                    require('babel-plugin-transform-flow-enums'),
                    require('@babel/plugin-transform-flow-strip-types'),
                ],
            },
            {
                plugins: [
                    [
                        require('@babel/plugin-proposal-class-properties'),
                        // use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
                        {
                            loose: true,
                        },
                    ],
                    require('@babel/plugin-syntax-dynamic-import'),
                    require('@babel/plugin-syntax-export-default-from'),
                ],
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
        plugins: [require('babel-plugin-react-native-web')],
    };
}
exports.babelPresetExpoWeb = babelPresetExpoWeb;
