"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const buildAsyncRequire_1 = require("./buildAsyncRequire");
// @ts-ignore
global[`${(_a = global.__METRO_GLOBAL_PREFIX__) !== null && _a !== void 0 ? _a : ""}__loadBundleAsync`] =
    (0, buildAsyncRequire_1.buildAsyncRequire)();
//# sourceMappingURL=index.js.map