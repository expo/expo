"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
function Portal(_a) {
    var isVisible = _a.isVisible, children = _a.children;
    if (!children) {
        return null;
    }
    return (react_1.default.createElement(react_native_1.View, { style: [react_native_1.StyleSheet.absoluteFill, styles.container, { opacity: isVisible ? 0.5 : 0 }], pointerEvents: "none" }, children));
}
exports.default = Portal;
var styles = react_native_1.StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgb(255, 255, 255)',
    },
});
//# sourceMappingURL=Portal.js.map