"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingIcon = MissingIcon;
const react_native_1 = require("react-native");
const Text_1 = require("./Text");
function MissingIcon({ color, size, style }) {
    return <Text_1.Text style={[styles.icon, { color, fontSize: size }, style]}>⏷</Text_1.Text>;
}
const styles = react_native_1.StyleSheet.create({
    icon: {
        backgroundColor: 'transparent',
    },
});
//# sourceMappingURL=MissingIcon.js.map