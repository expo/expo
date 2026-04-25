"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Head = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const expo_constants_1 = __importDefault(require("expo-constants"));
const lib_1 = require("../../vendor/react-helmet-async/lib");
const useIsFocused_1 = require("../useIsFocused");
function FocusedHelmet({ children }) {
    return (0, jsx_runtime_1.jsx)(lib_1.Helmet, { children: children });
}
const Head = ({ children }) => {
    const isFocused = (0, useIsFocused_1.useIsFocused)();
    if (!isFocused) {
        return null;
    }
    const manifest = expo_constants_1.default.expoConfig;
    if (manifest) {
        if (__DEV__ && manifest.extra?.router?.unstable_useServerRendering) {
            console.warn('<Head> is not supported when server rendering is enabled. Use `generateMetadata()` to generate page metadata instead');
        }
    }
    return (0, jsx_runtime_1.jsx)(FocusedHelmet, { children: children });
};
exports.Head = Head;
exports.Head.Provider = lib_1.HelmetProvider;
//# sourceMappingURL=ExpoHead.js.map