"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var react_native_safe_area_context_1 = require("react-native-safe-area-context");
function RunnerError(_a) {
    var children = _a.children;
    var top = (0, react_native_safe_area_context_1.useSafeAreaInsets)().top;
    return (react_1.default.createElement(react_native_1.View, { style: [styles.container, { top: top || 18 }] },
        react_1.default.createElement(react_native_1.Text, { style: styles.text }, children)));
}
exports.default = RunnerError;
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: 'red',
    },
});
//# sourceMappingURL=RunnerError.js.map