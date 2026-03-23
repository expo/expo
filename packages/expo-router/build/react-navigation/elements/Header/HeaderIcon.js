"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ICON_MARGIN = exports.ICON_SIZE = void 0;
exports.HeaderIcon = HeaderIcon;
const react_native_1 = require("react-native");
const native_1 = require("../../native");
function HeaderIcon({ source, style, ...rest }) {
    const { colors } = (0, native_1.useTheme)();
    const { direction } = (0, native_1.useLocale)();
    return (<react_native_1.Image source={source} resizeMode="contain" fadeDuration={0} tintColor={colors.text} style={[styles.icon, direction === 'rtl' && styles.flip, style]} {...rest}/>);
}
exports.ICON_SIZE = react_native_1.Platform.OS === 'ios' ? 21 : 24;
exports.ICON_MARGIN = react_native_1.Platform.OS === 'ios' ? 8 : 3;
const styles = react_native_1.StyleSheet.create({
    icon: {
        width: exports.ICON_SIZE,
        height: exports.ICON_SIZE,
        margin: exports.ICON_MARGIN,
    },
    flip: {
        transform: 'scaleX(-1)',
    },
});
//# sourceMappingURL=HeaderIcon.js.map