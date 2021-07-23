"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
function HeadingText(props) {
    return (react_1.default.createElement(react_native_1.View, { style: styles.container },
        react_1.default.createElement(react_native_1.Text, { style: [styles.headingText, props.style] }, props.children)));
}
exports.default = HeadingText;
var styles = react_native_1.StyleSheet.create({
    container: {
        marginTop: 16,
    },
    headingText: {
        fontWeight: 'bold',
        fontSize: 18,
    },
});
//# sourceMappingURL=HeadingText.js.map