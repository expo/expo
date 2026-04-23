"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Label = Label;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const Text_1 = require("../Text");
function Label({ tintColor, style, ...rest }) {
    return ((0, jsx_runtime_1.jsx)(Text_1.Text, { numberOfLines: 1, ...rest, style: [styles.label, tintColor != null && { color: tintColor }, style] }));
}
const styles = react_native_1.StyleSheet.create({
    label: {
        textAlign: 'center',
        backgroundColor: 'transparent',
    },
});
//# sourceMappingURL=Label.js.map