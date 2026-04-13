"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Html = Html;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const html_1 = require("expo-router/html");
function Html({ children }) {
    return ((0, jsx_runtime_1.jsxs)("html", { lang: "en", children: [(0, jsx_runtime_1.jsxs)("head", { children: [(0, jsx_runtime_1.jsx)("meta", { charSet: "utf-8" }), (0, jsx_runtime_1.jsx)("meta", { httpEquiv: "X-UA-Compatible", content: "IE=edge" }), (0, jsx_runtime_1.jsx)("meta", { name: "viewport", content: "width=device-width, initial-scale=1, shrink-to-fit=no" }), (0, jsx_runtime_1.jsx)(html_1.ScrollViewStyleReset, {})] }), (0, jsx_runtime_1.jsx)("body", { children: children })] }));
}
//# sourceMappingURL=html.js.map