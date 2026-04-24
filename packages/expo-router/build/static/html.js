"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrollViewStyleReset = ScrollViewStyleReset;
exports.InnerRoot = InnerRoot;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const ServerDataLoaderContext_1 = require("../loaders/ServerDataLoaderContext");
const native_1 = require("../react-navigation/native");
/**
 * Root style-reset for full-screen React Native web apps with a root `<ScrollView />` should use the following styles to ensure native parity. [Learn more](https://necolas.github.io/react-native-web/docs/setup/#root-element).
 */
function ScrollViewStyleReset() {
    return ((0, jsx_runtime_1.jsx)("style", { id: "expo-reset", dangerouslySetInnerHTML: {
            __html: `#root,body,html{height:100%}body{overflow:hidden}#root{display:flex}`,
        } }));
}
function InnerRoot({ children, loadedData, }) {
    // NOTE(@hassankhan): This ref seems to be unnecessary, double-check SSR/SSG code paths and remove
    const ref = react_1.default.createRef();
    return ((0, jsx_runtime_1.jsx)(ServerDataLoaderContext_1.ServerDataLoaderContext, { value: loadedData, children: (0, jsx_runtime_1.jsx)(native_1.ServerContainer, { ref: ref, children: children }) }));
}
//# sourceMappingURL=html.js.map