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
const fix_hermes_v1_async_arrow_non_simple_params_1 = require("../plugins/fix-hermes-v1-async-arrow-non-simple-params");
const fix_hermes_v1_class_in_finally_1 = require("../plugins/fix-hermes-v1-class-in-finally");
const fix_hermes_v1_super_in_object_accessor_1 = require("../plugins/fix-hermes-v1-super-in-object-accessor");
// use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
const loose = true;
/** The JS syntax preset used with Hermes v1 (SDK 56+) */
module.exports = function (_api, _options) {
    const plugins = [
        // NOTE(@kitten): See individual plugins for which Hermes v1 fixes they correspond to
        [fix_hermes_v1_async_arrow_non_simple_params_1.fixHermesV1AsyncArrowNonSimpleParams],
        [fix_hermes_v1_super_in_object_accessor_1.fixHermesV1SuperInObjectAccessor],
        [fix_hermes_v1_class_in_finally_1.fixHermesV1ClassInFinally],
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