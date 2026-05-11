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
module.exports = function (_api, _options) {
    const plugins = [
        [require('@babel/plugin-transform-block-scoping')],
        [require('@babel/plugin-transform-class-static-block'), { loose }],
        [require('@babel/plugin-transform-async-generator-functions')],
    ];
    return {
        comments: false,
        compact: true,
        plugins,
    };
};
//# sourceMappingURL=hermes-v1.js.map