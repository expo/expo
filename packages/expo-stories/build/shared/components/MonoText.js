"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var html_elements_1 = require("@expo/html-elements");
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var MonoText = function (_a) {
    var children = _a.children, containerStyle = _a.containerStyle, textStyle = _a.textStyle;
    return (react_1.default.createElement(react_native_1.View, { style: [styles.container, containerStyle] },
        react_1.default.createElement(html_elements_1.Code, { style: [styles.monoText, textStyle] }, children)));
};
exports.default = MonoText;
var styles = react_native_1.StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        padding: 6,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#666666',
    },
    monoText: {
        fontSize: 10,
    },
});
//# sourceMappingURL=MonoText.js.map