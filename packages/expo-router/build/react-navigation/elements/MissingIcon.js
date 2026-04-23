"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingIcon = MissingIcon;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const Text_1 = require("./Text");
function MissingIcon({ color, size, style }) {
    return (0, jsx_runtime_1.jsx)(Text_1.Text, { style: [styles.icon, { color, fontSize: size }, style], children: "\u23F7" });
}
const styles = react_native_1.StyleSheet.create({
    icon: {
        backgroundColor: 'transparent',
    },
});
//# sourceMappingURL=MissingIcon.js.map