"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Head = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
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
    return (0, jsx_runtime_1.jsx)(FocusedHelmet, { children: children });
};
exports.Head = Head;
exports.Head.Provider = lib_1.HelmetProvider;
//# sourceMappingURL=ExpoHead.js.map