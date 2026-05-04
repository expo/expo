"use strict";
/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Vendored from `@react-native/babel-preset` for the Hermes V1 (hermes-stable/hermes-canary)
 * transform profile. This profile preserves classes and conditionally enables regenerator in dev.
 * https://github.com/facebook/react-native/blob/main/packages/react-native-babel-preset/src/configs/main.js
 */
Object.defineProperty(exports, "__esModule", { value: true });
// use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
const loose = true;
/** The JS syntax preset used with Hermes v1 (SDK 56+) */
module.exports = function (_api, options) {
    // We enable regenerator in dev builds for the time being because
    // Hermes V1 doesn't yet fully support debugging native generators.
    // Use native generators in release mode because it has already yielded perf wins.
    const enableRegenerator = options.dev ?? false;
    const plugins = [
        [require('@babel/plugin-transform-block-scoping')],
        // NOTE: Hermes V1 preserves classes, so no class-properties or transform-classes plugins.
        [require('@babel/plugin-transform-class-static-block'), { loose }],
        [require('@babel/plugin-transform-private-methods'), { loose }],
        [require('@babel/plugin-transform-private-property-in-object'), { loose }],
        [require('@babel/plugin-transform-unicode-regex')],
        [require('@babel/plugin-transform-named-capturing-groups-regex')],
    ];
    // Needed for regenerator
    if (enableRegenerator) {
        plugins.push([require('@babel/plugin-transform-optional-catch-binding')]);
    }
    plugins.push([require('@babel/plugin-transform-destructuring'), { useBuiltIns: true }], [require('@babel/plugin-transform-async-generator-functions')], [require('@babel/plugin-transform-async-to-generator')], [require('@babel/plugin-transform-react-display-name')]);
    if (enableRegenerator) {
        plugins.push([require('@babel/plugin-transform-optional-chaining'), { loose: true }], [require('@babel/plugin-transform-nullish-coalescing-operator'), { loose: true }], [require('@babel/plugin-transform-for-of'), { loose: true }]);
    }
    return {
        comments: false,
        compact: true,
        plugins,
    };
};
//# sourceMappingURL=hermes-v1.js.map