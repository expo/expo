"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Head = void 0;
const native_1 = require("@react-navigation/native");
const react_1 = __importDefault(require("react"));
const lib_1 = require("../../vendor/react-helmet-async/lib");
function FocusedHelmet({ children }) {
    return <lib_1.Helmet>{children}</lib_1.Helmet>;
}
const Head = ({ children }) => {
    const isFocused = (0, native_1.useIsFocused)();
    if (!isFocused) {
        return null;
    }
    return <FocusedHelmet>{children}</FocusedHelmet>;
};
exports.Head = Head;
exports.Head.Provider = lib_1.HelmetProvider;
//# sourceMappingURL=ExpoHead.js.map