"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.babelPresetExpoNative = void 0;
const lazyImports_1 = require("./lazyImports");
function babelPresetExpoNative(api, options = {}) {
    const { native = {} } = options;
    // Note that if `options.lazyImports` is not set (i.e., `null` or `undefined`),
    // `metro-react-native-babel-preset` will handle it.
    const lazyImportsOption = options?.lazyImports;
    const extraPlugins = [];
    const engine = api.caller((caller) => caller?.engine) ?? 'default';
    if (engine !== 'hermes') {
        // `metro-react-native-babel-preset` configures this plugin with `{ loose: true }`, which breaks all
        // getters and setters in spread objects. We need to add this plugin ourself without that option.
        // @see https://github.com/expo/expo/pull/11960#issuecomment-887796455
        extraPlugins.push([
            require.resolve('@babel/plugin-proposal-object-rest-spread'),
            { loose: false },
        ]);
    }
    const platformOptions = {
        disableImportExportTransform: false,
        unstable_transformProfile: engine === 'hermes' ? 'hermes-stable' : 'default',
        ...native,
    };
    // Set true to disable `@babel/plugin-transform-react-jsx`
    // we override this logic outside of the metro preset so we can add support for
    // React 17 automatic JSX transformations.
    // If the logic for `useTransformReactJSXExperimental` ever changes in `metro-react-native-babel-preset`
    // then this block should be updated to reflect those changes.
    if (!platformOptions.useTransformReactJSXExperimental) {
        extraPlugins.push([
            require('@babel/plugin-transform-react-jsx'),
            {
                // Defaults to `automatic`, pass in `classic` to disable auto JSX transformations.
                runtime: (options && options.jsxRuntime) || 'automatic',
                ...(options &&
                    options.jsxRuntime !== 'classic' && {
                    importSource: (options && options.jsxImportSource) || 'react',
                }),
            },
        ]);
        // Purposefully not adding the deprecated packages:
        // `@babel/plugin-transform-react-jsx-self` and `@babel/plugin-transform-react-jsx-source`
        // back to the preset.
    }
    return {
        presets: [
            [
                // We use `require` here instead of directly using the package name because we want to
                // specifically use the `metro-react-native-babel-preset` installed by this package (ex:
                // `babel-preset-expo/node_modules/`). This way the preset will not change unintentionally.
                // Reference: https://github.com/expo/expo/pull/4685#discussion_r307143920
                require('metro-react-native-babel-preset'),
                {
                    // Defaults to undefined, set to something truthy to disable `@babel/plugin-transform-react-jsx-self` and `@babel/plugin-transform-react-jsx-source`.
                    withDevTools: platformOptions.withDevTools,
                    // Defaults to undefined, set to `false` to disable `@babel/plugin-transform-runtime`
                    enableBabelRuntime: platformOptions.enableBabelRuntime,
                    // This reduces the amount of transforms required, as Hermes supports many modern language features.
                    unstable_transformProfile: platformOptions.unstable_transformProfile,
                    // Set true to disable `@babel/plugin-transform-react-jsx` and
                    // the deprecated packages `@babel/plugin-transform-react-jsx-self`, and `@babel/plugin-transform-react-jsx-source`.
                    //
                    // Otherwise, you'll sometime get errors like the following (starting in Expo SDK 43, React Native 64, React 17):
                    //
                    // TransformError App.js: /path/to/App.js: Duplicate __self prop found. You are most likely using the deprecated transform-react-jsx-self Babel plugin.
                    // Both __source and __self are automatically set when using the automatic jsxRuntime. Please remove transform-react-jsx-source and transform-react-jsx-self from your Babel config.
                    useTransformReactJSXExperimental: true,
                    disableImportExportTransform: platformOptions.disableImportExportTransform,
                    lazyImportExportTransform: lazyImportsOption === true
                        ? (importModuleSpecifier) => {
                            // Do not lazy-initialize packages that are local imports (similar to `lazy: true`
                            // behavior) or are in the blacklist.
                            return !(importModuleSpecifier.includes('./') || lazyImports_1.lazyImports.has(importModuleSpecifier));
                        }
                        : // Pass the option directly to `metro-react-native-babel-preset`, which in turn
                            // passes it to `babel-plugin-transform-modules-commonjs`
                            lazyImportsOption,
                },
            ],
        ],
        plugins: extraPlugins,
    };
}
exports.babelPresetExpoNative = babelPresetExpoNative;
