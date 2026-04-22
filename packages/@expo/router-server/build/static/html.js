"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreloadedDataScript = PreloadedDataScript;
exports.Html = Html;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const html_1 = require("expo-router/html");
const html_2 = require("../utils/html");
/**
 * Injects loader data into the HTML as a script tag for client-side hydration.
 * The data is serialized as JSON and made available on the `globalThis.__EXPO_ROUTER_LOADER_DATA__` global.
 */
function PreloadedDataScript({ data }) {
    const safeJson = (0, html_2.escapeUnsafeCharacters)(JSON.stringify(data));
    return ((0, jsx_runtime_1.jsx)("script", { id: "expo-router-data", type: "module", dangerouslySetInnerHTML: {
            // NOTE(@hassankhan): The double serialization used here isn't as much of a problem server-side, but allows faster
            // client-side parsing using native `JSON.parse()`. See https://v8.dev/blog/cost-of-javascript-2019#json
            __html: `globalThis.__EXPO_ROUTER_LOADER_DATA__ = JSON.parse(${JSON.stringify(safeJson)});`,
        } }));
}
function Html({ children }) {
    return ((0, jsx_runtime_1.jsxs)("html", { lang: "en", children: [(0, jsx_runtime_1.jsxs)("head", { children: [(0, jsx_runtime_1.jsx)("meta", { charSet: "utf-8" }), (0, jsx_runtime_1.jsx)("meta", { httpEquiv: "X-UA-Compatible", content: "IE=edge" }), (0, jsx_runtime_1.jsx)("meta", { name: "viewport", content: "width=device-width, initial-scale=1, shrink-to-fit=no" }), (0, jsx_runtime_1.jsx)(html_1.ScrollViewStyleReset, {})] }), (0, jsx_runtime_1.jsx)("body", { children: children })] }));
}
//# sourceMappingURL=html.js.map