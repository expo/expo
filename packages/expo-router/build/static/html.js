"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Html = exports.ScrollViewStyleReset = void 0;
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const react_1 = __importDefault(require("react"));
/**
 * Root style-reset for full-screen React Native web apps with a root `<ScrollView />` should use the following styles to ensure native parity. [Learn more](https://necolas.github.io/react-native-web/docs/setup/#root-element).
 */
function ScrollViewStyleReset() {
    return (react_1.default.createElement("style", { id: "expo-reset", dangerouslySetInnerHTML: {
            __html: `#root,body{display:flex}#root,body,html{width:100%;-webkit-overflow-scrolling:touch;margin:0;padding:0;min-height:100%}#root{flex-shrink:0;flex-basis:auto;flex-grow:1;flex:1}html{scroll-behavior:smooth;-webkit-text-size-adjust:100%;height:calc(100% + env(safe-area-inset-top))}body{overflow-y:auto;overscroll-behavior-y:none;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;-ms-overflow-style:scrollbar}`,
        } }));
}
exports.ScrollViewStyleReset = ScrollViewStyleReset;
function Html({ children }) {
    return (react_1.default.createElement("html", { lang: "en" },
        react_1.default.createElement("head", null,
            react_1.default.createElement("meta", { charSet: "utf-8" }),
            react_1.default.createElement("meta", { httpEquiv: "X-UA-Compatible", content: "IE=edge" }),
            react_1.default.createElement("meta", { name: "viewport", content: "width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1.00001,viewport-fit=cover" }),
            react_1.default.createElement(ScrollViewStyleReset, null)),
        react_1.default.createElement("body", null, children)));
}
exports.Html = Html;
//# sourceMappingURL=html.js.map