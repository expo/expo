/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterContext = exports.parseRoute = void 0;
const react_1 = require("react");
const common_1 = require("./common");
const parseRoute = (url) => {
    if (globalThis.__EXPO_ROUTER_404__) {
        return { path: '/404', searchParams: new URLSearchParams() };
    }
    const { pathname, searchParams } = url;
    if (searchParams.has(common_1.PARAM_KEY_SKIP)) {
        console.warn(`The search param "${common_1.PARAM_KEY_SKIP}" is reserved`);
    }
    return { path: pathname, searchParams };
};
exports.parseRoute = parseRoute;
exports.RouterContext = (0, react_1.createContext)(null);
//# sourceMappingURL=router-context.js.map